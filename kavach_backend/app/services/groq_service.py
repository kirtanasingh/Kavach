import base64
import asyncio
import json
import logging
import os
import tempfile
from pathlib import Path

from groq import Groq

from app.core.config import settings

logger = logging.getLogger(__name__)

GROQ_VISION_MODELS = [
    os.getenv("GROQ_VISION_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct"),
    "llama-3.2-11b-vision-preview",
]

CANONICAL_DISEASES: dict[str, list[str]] = {
    "pig": [
        "African Swine Fever (ASF)",
        "Porcine Reproductive and Respiratory Syndrome (PRRS)",
        "Foot and Mouth Disease",
        "Swine Erysipelas",
        "Porcine Circovirus Disease",
        "Healthy (no disease detected)",
    ],
    "poultry": [
        "Newcastle Disease",
        "Avian Influenza (Bird Flu)",
        "Infectious Bronchitis",
        "Marek's Disease",
        "Coccidiosis",
        "Fowl Pox",
        "Healthy (no disease detected)",
    ],
}

DISEASE_ALIASES: dict[str, dict[str, str]] = {
    "pig": {
        "african swine fever": "African Swine Fever (ASF)",
        "asf": "African Swine Fever (ASF)",
        "prrs": "Porcine Reproductive and Respiratory Syndrome (PRRS)",
        "porcine reproductive and respiratory syndrome": "Porcine Reproductive and Respiratory Syndrome (PRRS)",
        "foot-and-mouth disease": "Foot and Mouth Disease",
        "foot and mouth": "Foot and Mouth Disease",
        "swine erysipelas": "Swine Erysipelas",
        "porcine circovirus": "Porcine Circovirus Disease",
        "healthy": "Healthy (no disease detected)",
        "normal": "Healthy (no disease detected)",
        "no disease": "Healthy (no disease detected)",
    },
    "poultry": {
        "newcastle": "Newcastle Disease",
        "avian influenza": "Avian Influenza (Bird Flu)",
        "bird flu": "Avian Influenza (Bird Flu)",
        "infectious bronchitis": "Infectious Bronchitis",
        "marek": "Marek's Disease",
        "coccidiosis": "Coccidiosis",
        "fowl pox": "Fowl Pox",
        "healthy": "Healthy (no disease detected)",
        "normal": "Healthy (no disease detected)",
        "no disease": "Healthy (no disease detected)",
    },
}


def _encode_image(image_path: str) -> tuple[str, str]:
    path = Path(image_path)
    suffix = path.suffix.lower()
    media_map = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
    }
    media_type = media_map.get(suffix, "image/jpeg")
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8"), media_type


def build_vlm_prompt(animal_type: str) -> str:
    classes = CANONICAL_DISEASES.get(animal_type.lower(), ["Healthy (no disease detected)"])
    class_list = "\n".join(f"- {c}" for c in classes)

    return f"""You are a veterinary AI assistant specialized in {animal_type} disease detection.

Analyze this image of a {animal_type} and classify it into EXACTLY ONE of these disease categories:
{class_list}

Do not invent new disease names. Use the closest exact label from the list above.

Respond ONLY in this JSON format (no markdown, no preamble):
{{
  "disease": "<exact disease name from the list above>",
  "confidence": <float 0.0-1.0>,
  "severity": "<mild|moderate|severe|none>",
  "visual_indicators": ["<symptom 1>", "<symptom 2>"],
  "recommendation": "<one sentence action for the farmer>",
  "requires_vet": <true|false>
}}"""


def _normalize_disease_name(animal_type: str, predicted: str) -> str:
    raw = (predicted or "").strip()
    if not raw:
        return "Healthy (no disease detected)"

    canonical = CANONICAL_DISEASES.get(animal_type.lower(), [])
    if raw in canonical:
        return raw

    lowered = raw.lower()
    aliases = DISEASE_ALIASES.get(animal_type.lower(), {})
    for key, value in aliases.items():
        if key in lowered:
            return value

    # If the model gives unknown text, return healthy label only when explicitly healthy-like.
    if any(token in lowered for token in ["healthy", "normal", "no disease"]):
        return "Healthy (no disease detected)"

    return raw


def _build_validation_prompt(expected_animal_type: str) -> str:
    return f"""You are validating farm image uploads.

Expected animal category: {expected_animal_type}.

Decide whether this image is a real animal photo and whether it matches the expected category.
- Accepted categories: pig, poultry
- Reject objects, people, scenery, text screenshots, logos, and non-animal images.

Return ONLY JSON:
{{
  "is_animal": <true|false>,
  "detected_animal_type": "pig|poultry|other|unknown",
  "is_expected_type": <true|false>,
  "reason": "<short reason>"
}}"""


def _fallback_response(animal_type: str, reason: str = "unknown") -> dict:
    logger.warning("Using fallback response | reason=%s | animal=%s", reason, animal_type)
    return {
        "disease": "Analysis unavailable",
        "confidence": 0.0,
        "severity": "unknown",
        "visual_indicators": [],
        "recommendation": "Please consult a veterinarian for proper diagnosis.",
        "requires_vet": True,
        "source": "fallback",
        "fallback_reason": reason,
    }


async def analyze_image_with_groq(image_path: str, animal_type: str) -> dict:
    api_key = settings.groq_api_key or os.getenv("GROQ_API_KEY", "")
    if not api_key:
        logger.error("GROQ_API_KEY is not set")
        return _fallback_response(animal_type, reason="API key missing")

    try:
        b64_image, media_type = _encode_image(image_path)
    except FileNotFoundError:
        logger.error("Image not found: %s", image_path)
        return _fallback_response(animal_type, reason="Image file not found")

    prompt = build_vlm_prompt(animal_type)

    raw_text = ""
    try:
        print("🔥 GROQ API CALLED")
        client = Groq(api_key=api_key)

        last_error: Exception | None = None
        for model_name in GROQ_VISION_MODELS:
            try:
                def _call_groq() -> str:
                    response = client.chat.completions.create(
                        model=model_name,
                        messages=[
                            {
                                "role": "user",
                                "content": [
                                    {
                                        "type": "text",
                                        "text": prompt,
                                    },
                                    {
                                        "type": "image_url",
                                        "image_url": {
                                            "url": f"data:{media_type};base64,{b64_image}"
                                        },
                                    },
                                ],
                            }
                        ],
                        max_tokens=512,
                        temperature=0.1,
                    )
                    return response.choices[0].message.content or ""

                raw_text = await asyncio.to_thread(_call_groq)
                break
            except Exception as model_error:
                last_error = model_error
                logger.warning("Groq model attempt failed | model=%s | error=%s", model_name, model_error)
        else:
            raise last_error or RuntimeError("No Groq models available")

        cleaned = raw_text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("```")[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
            cleaned = cleaned.strip()

        result = json.loads(cleaned)
        result["disease"] = _normalize_disease_name(animal_type, result.get("disease", ""))
        result["source"] = "groq_vlm"
        return result

    except json.JSONDecodeError:
        logger.error("Failed to parse Groq JSON response: %s", raw_text)
        return _fallback_response(animal_type, reason="Invalid JSON from model")
    except Exception as e:
        logger.exception("Unexpected error calling Groq: %s", e)
        return _fallback_response(animal_type, reason=str(e))


async def validate_animal_image(image_path: str, expected_animal_type: str) -> tuple[bool, str]:
    expected = expected_animal_type.lower().strip()
    if expected not in {"pig", "poultry"}:
        return False, "Only pig and poultry images are supported."

    api_key = settings.groq_api_key or os.getenv("GROQ_API_KEY", "")
    if not api_key:
        return False, "Image validation is unavailable right now."

    try:
        b64_image, media_type = _encode_image(image_path)
    except FileNotFoundError:
        return False, "Uploaded image file was not found."

    prompt = _build_validation_prompt(expected)
    client = Groq(api_key=api_key)

    raw_text = ""
    last_error: Exception | None = None
    for model_name in GROQ_VISION_MODELS:
        try:
            def _call_groq() -> str:
                response = client.chat.completions.create(
                    model=model_name,
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {
                                    "type": "image_url",
                                    "image_url": {"url": f"data:{media_type};base64,{b64_image}"},
                                },
                            ],
                        }
                    ],
                    max_tokens=220,
                    temperature=0.0,
                )
                return response.choices[0].message.content or ""

            raw_text = await asyncio.to_thread(_call_groq)
            break
        except Exception as model_error:
            last_error = model_error
            logger.warning("Groq validation model failed | model=%s | error=%s", model_name, model_error)
    else:
        return False, f"Image validation unavailable: {last_error}"

    try:
        cleaned = raw_text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("```")[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
            cleaned = cleaned.strip()
        parsed = json.loads(cleaned)
    except Exception:
        logger.error("Validation response parse failed: %s", raw_text)
        return False, "Could not validate image type. Please upload a clear pig or poultry photo."

    is_animal = bool(parsed.get("is_animal", False))
    is_expected = bool(parsed.get("is_expected_type", False))
    reason = str(parsed.get("reason") or "Invalid image for selected animal type.")

    if not is_animal:
        return False, "Invalid image: upload a real animal photo (pig or poultry)."
    if not is_expected:
        return False, f"Invalid image for selected type ({expected}). {reason}"

    return True, "ok"


class GroqService:
    async def validate_animal(self, image_bytes: bytes, animal_type: str) -> bool:
        return True

    async def diagnose_animal(self, image_bytes: bytes, animal_type: str) -> dict:
        # Compatibility helper for older async worker code paths.
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            tmp.write(image_bytes)
            tmp_path = tmp.name

        result = await analyze_image_with_groq(tmp_path, animal_type)
        Path(tmp_path).unlink(missing_ok=True)

        return {
            "disease_name": result.get("disease", "Analysis unavailable"),
            "confidence": float(result.get("confidence", 0.0)),
            "findings": result.get("visual_indicators", []),
        }


groq_service = GroqService()