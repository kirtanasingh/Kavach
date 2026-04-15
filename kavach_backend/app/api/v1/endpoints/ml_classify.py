"""FastAPI router exposing local ML classifier endpoints."""

import json
from typing import Dict, List

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.ml.ml_classify import LABELS_PATH, classify, get_model_health

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/bmp"}
MAX_FILE_SIZE_MB = 10
MAX_FILE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
VALID_ANIMAL_PREFIXES = {"pig", "poultry", "cattle"}
CONFIDENCE_THRESHOLD = 0.30


class PredictionResult(BaseModel):
    top_prediction: str
    confidence: float
    animal_type: str
    disease: str
    is_certain: bool
    top5: List[Dict[str, float | str]]
    raw_label: str


router = APIRouter(prefix="/ml", tags=["ML Classifier"])


@router.post("/classify", response_model=PredictionResult)
async def classify_image(file: UploadFile = File(...)) -> PredictionResult:
    """Accept an image and return top prediction from local model."""
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=(
                f"Unsupported file type '{file.content_type}'. "
                f"Accepted: {', '.join(sorted(ALLOWED_CONTENT_TYPES))}"
            ),
        )

    data = await file.read()
    if len(data) > MAX_FILE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({len(data)/(1024*1024):.1f} MB). Max {MAX_FILE_SIZE_MB} MB.",
        )

    try:
        raw = classify(data)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Classification failed: {exc}") from exc

    top = raw.get("top_prediction", {"label": "unknown", "confidence": 0.0})
    top3 = raw.get("top_3", [])
    label = str(top.get("label", "unknown"))
    confidence = float(top.get("confidence", 0.0))

    if "_" in label:
        animal_type, disease = label.split("_", 1)
    else:
        animal_type, disease = "unknown", label

    result = PredictionResult(
        top_prediction=label,
        confidence=confidence,
        animal_type=animal_type,
        disease=disease,
        is_certain=confidence >= CONFIDENCE_THRESHOLD,
        top5=top3,
        raw_label=label,
    )

    if result.animal_type not in VALID_ANIMAL_PREFIXES and result.animal_type != "unknown":
        raise HTTPException(
            status_code=422,
            detail=(
                f"Predicted class '{result.top_prediction}' has unknown animal type "
                f"'{result.animal_type}'. Supported: {sorted(VALID_ANIMAL_PREFIXES)}"
            ),
        )

    return result


@router.get("/labels")
async def get_labels() -> Dict[str, list]:
    """Return all known class labels grouped by animal type."""
    try:
        raw = json.loads(LABELS_PATH.read_text(encoding="utf-8"))
        labels: List[str] = [raw[k] for k in sorted(raw.keys(), key=lambda x: int(x))]
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    grouped: Dict[str, List[str]] = {}
    for label in labels:
        parts = label.split("_", 1)
        animal = parts[0] if len(parts) == 2 else "unknown"
        grouped.setdefault(animal, []).append(label)
    return {"labels": labels, "by_animal": grouped}


@router.get("/health")
async def ml_health() -> Dict[str, str]:
    """Check whether model files are available and model is loadable."""
    health = get_model_health()
    if health.get("status") != "ok":
        raise HTTPException(status_code=503, detail=health)
    return {k: str(v) for k, v in health.items()}
