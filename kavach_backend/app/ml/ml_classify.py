import io
import json
import time
from pathlib import Path
from typing import Any, Dict, List

import torch
import torch.nn.functional as F
from PIL import Image
from torch import nn
from torchvision import models, transforms

MODEL_PATH = Path(__file__).resolve().parent / "model.pt"
LABELS_PATH = Path(__file__).resolve().parent / "labels.json"

_model: nn.Module | None = None
_labels: Dict[str, str] | None = None
_device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

_tfm = transforms.Compose(
    [
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ]
)


def _load() -> None:
    global _model, _labels
    if _model is not None and _labels is not None:
        return

    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")
    if not LABELS_PATH.exists():
        raise FileNotFoundError(f"Labels file not found: {LABELS_PATH}")

    _labels = json.loads(LABELS_PATH.read_text(encoding="utf-8"))
    if not isinstance(_labels, dict):
        raise ValueError("labels.json must be a dict mapping class index to class label")

    m = models.efficientnet_b2(weights=None)
    m.classifier[1] = nn.Linear(m.classifier[1].in_features, len(_labels))
    m.load_state_dict(torch.load(MODEL_PATH, map_location=_device))
    m.eval()
    _model = m.to(_device)


def classify(image_bytes: bytes) -> Dict[str, Any]:
    _load()
    assert _model is not None and _labels is not None

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    tensor = _tfm(img).unsqueeze(0).to(_device)

    t0 = time.perf_counter()
    with torch.no_grad():
        probs = F.softmax(_model(tensor), dim=1)[0]
    ms = round((time.perf_counter() - t0) * 1000, 1)

    k = min(3, len(_labels))
    top_p, top_i = torch.topk(probs, k)

    top3: List[Dict[str, Any]] = []
    for p, i in zip(top_p, top_i):
        idx = str(i.item())
        top3.append(
            {
                "label": _labels.get(idx, "unknown"),
                "confidence": round(float(p.item()), 4),
            }
        )

    top_prediction = top3[0] if top3 else {"label": "unknown", "confidence": 0.0}
    return {
        "top_prediction": top_prediction,
        "top_3": top3,
        "is_confident": top_prediction["confidence"] >= 0.35,
        "inference_ms": ms,
    }


def get_model_health() -> Dict[str, Any]:
    model_found = MODEL_PATH.exists()
    labels_found = LABELS_PATH.exists()

    if not model_found or not labels_found:
        return {
            "status": "missing",
            "model_found": model_found,
            "labels_found": labels_found,
        }

    _load()
    assert _labels is not None
    return {
        "status": "ok",
        "num_classes": len(_labels),
        "device": str(_device),
    }
