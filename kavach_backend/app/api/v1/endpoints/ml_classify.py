"""
FastAPI router that exposes:
  - POST /api/v1/ml/classify
  - GET  /api/v1/ml/labels
  - GET  /api/v1/ml/health

Loads EfficientNet-B0 once, validates incoming images,
and returns structured classification results.
"""

import io
import json
import pathlib
from functools import lru_cache
from typing import Dict, List

import torch
import torch.nn as nn
from fastapi import APIRouter, File, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel
from torchvision import models, transforms

# ---------------------------------------------------------------------------
# Paths (relative to kavach_backend/app/api/v1/endpoints/ml_classify.py)
# ---------------------------------------------------------------------------

_ML_DIR = pathlib.Path(__file__).resolve().parents[4] / "ml_models"
_MODEL_PATH = _ML_DIR / "model.pt"
_LABELS_PATH = _ML_DIR / "labels.json"

# ---------------------------------------------------------------------------
# Validation constants
# ---------------------------------------------------------------------------

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/bmp"}
MAX_FILE_SIZE_MB = 10
MAX_FILE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
VALID_ANIMAL_PREFIXES = {"pig", "poultry", "cattle"}
CONFIDENCE_THRESHOLD = 0.30

# ---------------------------------------------------------------------------
# Pre-processing transform (must match train_classifier.py valid transform)
# ---------------------------------------------------------------------------

_TRANSFORM = transforms.Compose(
    [
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225],
        ),
    ]
)


# ---------------------------------------------------------------------------
# Response schema
# ---------------------------------------------------------------------------

class PredictionResult(BaseModel):
    top_prediction: str
    confidence: float
    animal_type: str
    disease: str
    is_certain: bool
    top5: List[Dict[str, float | str]]
    raw_label: str


# ---------------------------------------------------------------------------
# Model loader (singleton)
# ---------------------------------------------------------------------------

class _Classifier:
    def __init__(self) -> None:
        if not _MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Model not found at {_MODEL_PATH}. "
                "Run train_classifier.py first."
            )
        if not _LABELS_PATH.exists():
            raise FileNotFoundError(
                f"labels.json not found at {_LABELS_PATH}. "
                "Run train_classifier.py first."
            )

        self.labels: List[str] = json.loads(_LABELS_PATH.read_text())
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        mdl = models.efficientnet_b0(weights=None)
        in_features = mdl.classifier[1].in_features
        mdl.classifier = nn.Sequential(
            nn.Dropout(p=0.4, inplace=True),
            nn.Linear(in_features, len(self.labels)),
        )
        mdl.load_state_dict(torch.load(_MODEL_PATH, map_location=self.device))
        mdl.eval()
        self.model = mdl.to(self.device)

    @torch.no_grad()
    def predict(self, image: Image.Image) -> PredictionResult:
        tensor = _TRANSFORM(image).unsqueeze(0).to(self.device)
        with torch.cuda.amp.autocast(enabled=self.device.type == "cuda"):
            logits = self.model(tensor)

        probs = torch.softmax(logits, dim=1)[0]
        k = min(5, len(self.labels))
        top = probs.topk(k)

        top5 = [
            {
                "label": self.labels[idx.item()],
                "confidence": round(prob.item(), 4),
            }
            for prob, idx in zip(top.values, top.indices)
        ]

        best_label = str(top5[0]["label"])
        best_conf = float(top5[0]["confidence"])

        parts = best_label.split("_", 1)
        animal_type = parts[0] if len(parts) == 2 else "unknown"
        disease = parts[1] if len(parts) == 2 else best_label

        return PredictionResult(
            top_prediction=best_label,
            confidence=best_conf,
            animal_type=animal_type,
            disease=disease,
            is_certain=best_conf >= CONFIDENCE_THRESHOLD,
            top5=top5,
            raw_label=best_label,
        )


@lru_cache(maxsize=1)
def _get_classifier() -> _Classifier:
    return _Classifier()


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

router = APIRouter(prefix="/ml", tags=["ML Classifier"])


def _load_and_validate_image(data: bytes) -> Image.Image:
    """Decode bytes to PIL RGB image and validate basic constraints."""
    try:
        img = Image.open(io.BytesIO(data))
        img.verify()
    except UnidentifiedImageError as exc:
        raise HTTPException(
            status_code=422,
            detail="Uploaded file is not a recognised image format.",
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Image validation failed: {exc}",
        ) from exc

    # verify() consumes the stream; reopen image bytes for actual inference
    img = Image.open(io.BytesIO(data)).convert("RGB")

    w, h = img.size
    if w < 32 or h < 32:
        raise HTTPException(
            status_code=422,
            detail=f"Image too small ({w}x{h}px). Minimum 32x32 required.",
        )
    if w > 8000 or h > 8000:
        raise HTTPException(
            status_code=422,
            detail=f"Image too large ({w}x{h}px). Maximum 8000x8000 supported.",
        )
    return img


@router.post("/classify", response_model=PredictionResult)
async def classify_image(file: UploadFile = File(...)) -> PredictionResult:
    """Accept an animal image and return top class plus top-5 confidence list."""
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

    image = _load_and_validate_image(data)

    try:
        clf = _get_classifier()
        result = clf.predict(image)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Classification failed: {exc}") from exc

    if result.animal_type not in VALID_ANIMAL_PREFIXES:
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
        clf = _get_classifier()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    grouped: Dict[str, List[str]] = {}
    for label in clf.labels:
        parts = label.split("_", 1)
        animal = parts[0] if len(parts) == 2 else "unknown"
        grouped.setdefault(animal, []).append(label)
    return {"labels": clf.labels, "by_animal": grouped}


@router.get("/health")
async def ml_health() -> Dict[str, str]:
    """Check whether model files are available and model is loadable."""
    model_ok = _MODEL_PATH.exists()
    labels_ok = _LABELS_PATH.exists()
    if not model_ok or not labels_ok:
        raise HTTPException(
            status_code=503,
            detail={
                "model_found": model_ok,
                "labels_found": labels_ok,
            },
        )

    clf = _get_classifier()
    return {
        "status": "ok",
        "num_classes": str(len(clf.labels)),
        "device": str(clf.device),
    }
