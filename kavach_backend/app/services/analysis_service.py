import logging
import os
import base64
import uuid
from datetime import datetime
from typing import Dict, Any

import httpx

from app.core.config import settings
from app.ml.ml_classify import classify
from app.models.schemas import TriageScore, ScanStatus
from app.services.image_service import image_service
from app.services.redis_service import redis_service

logger = logging.getLogger(__name__)

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"


async def _groq_explain(image_bytes: bytes, ml: Dict[str, Any]) -> str:
    key = settings.groq_api_key or os.getenv("GROQ_API_KEY", "")
    if not key:
        return "GROQ_API_KEY not set in .env"

    top = ml.get("top_prediction", {"label": "unknown", "confidence": 0.0})
    top3 = ml.get("top_3", [])
    top3_text = ", ".join(
        f"{r.get('label', 'unknown')} {float(r.get('confidence', 0.0)):.0%}"
        for r in top3
    )

    b64 = base64.b64encode(image_bytes).decode("utf-8")
    payload = {
        "model": GROQ_MODEL,
        "max_tokens": 400,
        "temperature": 0.2,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a veterinary disease specialist AI. "
                    "An ML classifier analyzed the image. "
                    "Validate its prediction visually, describe visible symptoms, "
                    "and recommend action. Be concise (4-5 sentences)."
                ),
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            f"ML prediction: {top.get('label', 'unknown')} "
                            f"(confidence: {float(top.get('confidence', 0.0)):.0%})\\n"
                            f"Top-3: {top3_text}\\n\\n"
                            "Analyze the image and provide your clinical assessment."
                        ),
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{b64}"},
                    },
                ],
            },
        ],
    }

    try:
        async with httpx.AsyncClient(timeout=float(settings.GROQ_TIMEOUT_SECONDS)) as client:
            response = await client.post(
                GROQ_URL,
                json=payload,
                headers={"Authorization": f"Bearer {key}"},
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"].strip()
    except httpx.HTTPStatusError as exc:
        return f"Groq error {exc.response.status_code}: {exc.response.text[:300]}"
    except Exception as exc:
        return f"Groq failed: {exc}"


def _extract_animal_and_disease(label: str) -> tuple[str, str]:
    parts = label.split("_", 1)
    if len(parts) == 2:
        return parts[0], parts[1]
    return "unknown", label


async def analyze(image_bytes: bytes) -> Dict[str, Any]:
    try:
        ml = classify(image_bytes)
    except Exception as exc:
        ml = {
            "top_prediction": {"label": "unknown", "confidence": 0.0},
            "top_3": [],
            "is_confident": False,
            "inference_ms": 0,
            "error": str(exc),
        }

    explanation = await _groq_explain(image_bytes, ml)
    return {"ml": ml, "explanation": explanation}


async def run_disease_analysis(image_path: str, animal_type: str) -> dict:
    logger.info("Starting disease analysis | path=%s | animal=%s", image_path, animal_type)

    processed_path = image_service.preprocess_image(image_path)
    logger.info("Image preprocessed to %s", processed_path)

    with open(str(processed_path), "rb") as f:
        image_bytes = f.read()

    hybrid = await analyze(image_bytes)
    top_pred = hybrid["ml"].get("top_prediction", {"label": "unknown", "confidence": 0.0})
    label = str(top_pred.get("label", "unknown"))
    confidence = float(top_pred.get("confidence", 0.0))
    inferred_animal, disease = _extract_animal_and_disease(label)

    result = {
        "disease": disease,
        "confidence": confidence,
        "severity": "unknown",
        "visual_indicators": [],
        "recommendation": hybrid["explanation"],
        "requires_vet": confidence < 0.6,
        "source": "groq_vlm",
        "ml": hybrid["ml"],
        "explanation": hybrid["explanation"],
        "animal_type": inferred_animal if inferred_animal != "unknown" else animal_type,
    }

    # Persist a lightweight detection history record for dashboard endpoints.
    try:
        case_id = str(uuid.uuid4())
        status = ScanStatus.COMPLETED if confidence >= 0.6 else ScanStatus.MANUAL_REVIEW
        detection = {
            "case_id": case_id,
            "farm_id": "test_farm",
            "user_id": "test_user",
            "status": status,
            "ai_diagnosis": result.get("disease"),
            "triage_score": TriageScore.HIGH if confidence >= 0.85 else TriageScore.MEDIUM,
            "confidence": confidence,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "metadata": {
                "animal_type": result.get("animal_type", animal_type),
                "source": result.get("source", "unknown"),
            },
        }
        redis_service.set_detection(case_id, detection, expire=2592000)
        result["case_id"] = case_id
        result["status"] = str(status)
    except Exception as exc:
        logger.warning("Unable to save detection history: %s", exc)

    logger.info(
        "Analysis complete | disease=%s | confidence=%s",
        result.get("disease"),
        result.get("confidence"),
    )

    if processed_path != image_path and os.path.exists(str(processed_path)):
        os.remove(str(processed_path))

    return result

class AnalysisService:
    @staticmethod
    def compute_triage_score(diagnosis_result: Dict[str, Any]) -> TriageScore:
        """
        Assign triage score:
        HIGH: severe/critical keywords OR confidence > 0.85
        MEDIUM: moderate keywords
        LOW: mild/healthy keywords
        """
        disease_name = diagnosis_result.get("disease_name", "").lower()
        confidence = diagnosis_result.get("confidence", 0.0)
        findings = [f.lower() for f in diagnosis_result.get("findings", [])]
        
        severe_keywords = ["severe", "critical", "acute", "outbreak", "highly contagious", "fatal"]
        moderate_keywords = ["moderate", "chronic", "stable"]
        mild_keywords = ["mild", "healthy", "no disease", "normal"]
        
        # Check for severe conditions or high confidence
        is_severe = any(k in disease_name for k in severe_keywords) or \
                    any(any(k in f for k in severe_keywords) for f in findings)
        
        if is_severe or confidence > 0.85:
            return TriageScore.HIGH
        
        # Check for moderate conditions
        is_moderate = any(k in disease_name for k in moderate_keywords) or \
                      any(any(k in f for k in moderate_keywords) for f in findings)
        
        if is_moderate:
            return TriageScore.MEDIUM
            
        return TriageScore.LOW

    @staticmethod
    def trigger_alert(scan_id: str, farm_id: str, triage_score: TriageScore):
        """
        Trigger an alert if triage_score is HIGH.
        """
        if triage_score == TriageScore.HIGH:
            logger.error(f"ALERT: High-risk animal disease detected! Scan ID: {scan_id}, Farm ID: {farm_id}")
            # Stub for future API call to Person A's service
            # async with httpx.AsyncClient() as client:
            #     await client.post(f"{PERSON_A_URL}/alerts", json={"scan_id": scan_id, "farm_id": farm_id})
            pass

    @staticmethod
    def determine_final_status(confidence: float, triage_score: TriageScore) -> ScanStatus:
        """
        Improve status handling:
        low confidence -> manual_review
        severe -> flagged
        otherwise -> completed
        """
        if confidence < 0.6:
            return ScanStatus.MANUAL_REVIEW
        
        if triage_score == TriageScore.HIGH:
            return ScanStatus.FLAGGED
            
        return ScanStatus.COMPLETED

analysis_service = AnalysisService()
