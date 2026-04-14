import logging
import os
from typing import Dict, Any, Tuple
from app.models.schemas import TriageScore, ScanStatus
from app.services.groq_service import analyze_image_with_groq
from app.services.image_service import image_service

logger = logging.getLogger(__name__)


async def run_disease_analysis(image_path: str, animal_type: str) -> dict:
    logger.info("Starting disease analysis | path=%s | animal=%s", image_path, animal_type)

    processed_path = image_service.preprocess_image(image_path)
    logger.info("Image preprocessed to %s", processed_path)

    result = await analyze_image_with_groq(str(processed_path), animal_type)
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
