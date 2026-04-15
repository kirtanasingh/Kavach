import logging
import os
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional

import httpx

from app.models.schemas import TriageScore, ScanStatus
from app.services.groq_service import analyze_image_with_groq
from app.services.image_service import image_service

logger = logging.getLogger(__name__)


# Internal route mounted in main.py with prefix settings.API_V1_STR (/api/v1)
ML_CLASSIFY_URL = "http://localhost:8000/api/v1/ml/classify"


@dataclass
class MLClassifierResult:
    top_prediction: str
    confidence: float
    animal_type: str
    disease: str
    is_certain: bool
    top5: List[Dict[str, Any]] = field(default_factory=list)


async def run_local_classifier(image_path: str) -> Optional[MLClassifierResult]:
    """Call local EfficientNet endpoint and return parsed result, or None on failure."""
    try:
        with open(image_path, "rb") as img_file:
            payload = img_file.read()

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                ML_CLASSIFY_URL,
                files={"file": ("image.jpg", payload, "image/jpeg")},
            )

        if response.status_code != 200:
            logger.warning(
                "ML classifier returned %s: %s",
                response.status_code,
                response.text[:200],
            )
            return None

        data = response.json()
        return MLClassifierResult(
            top_prediction=data.get("top_prediction", "unknown"),
            confidence=float(data.get("confidence", 0.0)),
            animal_type=data.get("animal_type", "unknown"),
            disease=data.get("disease", "unknown"),
            is_certain=bool(data.get("is_certain", False)),
            top5=data.get("top5", []),
        )
    except httpx.ConnectError:
        logger.warning("ML classifier unavailable at %s. Falling back to Groq-only mode.", ML_CLASSIFY_URL)
        return None
    except Exception as exc:
        logger.error("Unexpected error calling local classifier: %s", exc)
        return None


def _confidence_label(conf: float) -> str:
    if conf >= 0.80:
        return "high"
    if conf >= 0.50:
        return "medium"
    return "low"


def _build_hybrid_response(
    groq_result: Dict[str, Any],
    ml_result: Optional[MLClassifierResult],
) -> Dict[str, Any]:
    """Return a merged response while preserving frontend compatibility fields."""
    out = dict(groq_result)

    out["ml"] = {
        "available": ml_result is not None,
        "top_prediction": ml_result.top_prediction if ml_result else "unavailable",
        "confidence": ml_result.confidence if ml_result else 0.0,
        "animal_type": ml_result.animal_type if ml_result else "unknown",
        "disease": ml_result.disease if ml_result else "unknown",
        "is_certain": ml_result.is_certain if ml_result else False,
        "top5": ml_result.top5 if ml_result else [],
    }

    # Existing frontend expects these keys
    out.setdefault("disease", "Analysis unavailable")
    out.setdefault("confidence", 0.0)
    out.setdefault("severity", "unknown")
    out.setdefault("visual_indicators", [])
    out.setdefault("recommendation", "Please consult a veterinarian for proper diagnosis.")
    out.setdefault("requires_vet", True)
    out.setdefault("source", "groq_vlm")

    # Additional hybrid metadata for future UI
    out["final_diagnosis"] = out.get("disease", "Analysis unavailable")
    out["confidence_label"] = _confidence_label(float(out.get("confidence", 0.0)))
    return out


async def run_disease_analysis(image_path: str, animal_type: str) -> dict:
    logger.info("Starting disease analysis | path=%s | animal=%s", image_path, animal_type)

    processed_path = image_service.preprocess_image(image_path)
    logger.info("Image preprocessed to %s", processed_path)

    ml_result = await run_local_classifier(str(processed_path))
    if ml_result:
        logger.info(
            "Local classifier | top=%s | conf=%.3f",
            ml_result.top_prediction,
            ml_result.confidence,
        )

    result = await analyze_image_with_groq(str(processed_path), animal_type)
    result = _build_hybrid_response(result, ml_result)

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
