import asyncio
from datetime import datetime
from celery import Celery
from app.core.config import settings
from app.services.redis_service import redis_service
from app.services.groq_service import groq_service
from app.services.analysis_service import analysis_service
from app.models.schemas import ScanStatus, FinalScanOutput, ScanResultJson

celery_app = Celery("worker", broker=settings.REDIS_URL, backend=settings.REDIS_URL)

@celery_app.task(name="diagnose_task")
def diagnose_task(scan_id: str, animal_type: str, farm_id: str):
    """
    Celery task to perform async diagnosis.
    """
    # Helper to run async functions in a synchronous Celery task
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(process_diagnosis(scan_id, animal_type, farm_id))

async def process_diagnosis(scan_id: str, animal_type: str, farm_id: str):
    # Update status to processing
    redis_service.set_scan_status(scan_id, ScanStatus.PROCESSING)
    
    # Get cached image bytes
    image_bytes = redis_service.get_image_bytes(scan_id)
    if not image_bytes:
        redis_service.set_scan_status(scan_id, ScanStatus.MANUAL_REVIEW)
        return {"error": "Image not found in cache"}
        
    # Perform diagnosis
    diagnosis_result = await groq_service.diagnose_animal(image_bytes, animal_type)
    
    # Compute triage score
    triage_score = analysis_service.compute_triage_score(diagnosis_result)
    
    # Trigger alert if HIGH
    analysis_service.trigger_alert(scan_id, farm_id, triage_score)
    
    # Determine final status
    final_status = analysis_service.determine_final_status(
        diagnosis_result.get("confidence", 0.0), 
        triage_score
    )
    
    # Prepare standardized final output
    final_output = FinalScanOutput(
        case_id=scan_id,
        status=final_status,
        triage_score=triage_score,
        result_json=ScanResultJson(
            disease_name=diagnosis_result.get("disease_name", "Unknown"),
            confidence=diagnosis_result.get("confidence", 0.0),
            findings=diagnosis_result.get("findings", [])
        )
    )
    
    # Store final result in Redis
    redis_service.set_scan_result(scan_id, final_output.dict())
    redis_service.set_scan_status(scan_id, final_status)
    
    # Store detection item for polling via detections endpoint
    detection_data = {
        "case_id": scan_id,
        "farm_id": farm_id,
        "user_id": "unknown",  # Would need to extract from JWT context
        "status": final_status,
        "ai_diagnosis": diagnosis_result.get("disease_name", "Unknown"),
        "triage_score": triage_score,
        "confidence": diagnosis_result.get("confidence", 0.0),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "metadata": {
            "animal_type": animal_type,
            "labels": diagnosis_result.get("findings", []),
            "frames_analysed": diagnosis_result.get("frames_analysed", 0)
        }
    }
    
    # Set status to pending_review if diagnosis confidence is sufficient
    if diagnosis_result.get("confidence", 0) > 0.65:
        detection_data["status"] = ScanStatus.FLAGGED
        redis_service.set_detection(scan_id, detection_data)
    
    return final_output.dict()
