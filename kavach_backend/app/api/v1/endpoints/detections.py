import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.core.security import get_current_user
from app.models.schemas import (
    UserPayload, Alert, DetectionItem, AnnotationRequest, AnnotationResponse, ScanStatus
)
from app.services.redis_service import redis_service

router = APIRouter()

# ==================== ALERTS ENDPOINTS ====================

@router.get("/alerts")
async def get_alerts(
    user: UserPayload = Depends(get_current_user),
    limit: int = Query(100, ge=1, le=1000)
):
    """
    Retrieve all alerts for the current user.
    Returns empty list (Redis not configured in dev mode).
    """
    return []

# ==================== DETECTIONS ENDPOINTS ====================

@router.get("/detections")
async def get_detections(
    detection_status: str = Query("pending_review", regex="^(pending_review|completed|processing|failed)$"),
    user: UserPayload = Depends(get_current_user),
    limit: int = Query(100, ge=1, le=1000)
):
    """
    Retrieve detections filtered by status.
    Returns empty list (Redis not configured in dev mode).
    """
    if detection_status == "pending_review":
        # Get pending review queue for vets
        if user.role not in ["Veterinarian", "Authority"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only veterinarians and authorities can view pending reviews"
            )
    
    return []

# ==================== ANNOTATIONS ENDPOINTS ====================

@router.post("/annotations/{case_id}", response_model=AnnotationResponse)
async def submit_annotation(
    case_id: str,
    annotation: AnnotationRequest,
    user: UserPayload = Depends(get_current_user)
):
    """
    Submit VLM annotation (acceptance or correction).
    Called by veterinarians to review and validate/correct AI diagnoses.
    """
    # Only vets can annotate
    if user.role != "Veterinarian":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only veterinarians can submit annotations"
        )
    
    # Get existing detection
    detection = redis_service.get_detection(case_id)
    if not detection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Detection case not found"
        )
    
    # Store annotation with vet feedback
    annotation_data = {
        "case_id": case_id,
        "vet_id": user.user_id,
        "vet_diagnosis": annotation.vet_diagnosis,
        "accepted": annotation.accepted,
        "notes": annotation.notes,
        "created_at": datetime.utcnow().isoformat()
    }
    
    redis_service.set_annotation(case_id, annotation_data)
    
    # Update detection status
    if annotation.accepted:
        detection["status"] = ScanStatus.COMPLETED
        detection["vet_reviewed"] = True
    else:
        detection["status"] = ScanStatus.MANUAL_REVIEW
        detection["vet_corrected_diagnosis"] = annotation.vet_diagnosis
    
    detection["updated_at"] = datetime.utcnow().isoformat()
    redis_service.set_detection(case_id, detection)
    
    # Log to alert system (optional)
    alert = {
        "id": str(uuid.uuid4()),
        "type": "approval",
        "severity": "info",
        "title": f"VLM annotation submitted for case {case_id}",
        "message": f"Vet {user.user_id} {'accepted' if annotation.accepted else 'corrected'} the diagnosis",
        "created_at": datetime.utcnow().isoformat(),
        "is_read": False,
        "farm_id": detection.get("farm_id")
    }
    redis_service.set_alert(alert["id"], alert)
    
    return AnnotationResponse(
        case_id=case_id,
        status="submitted",
        message="Annotation submitted successfully"
    )

@router.get("/annotations/{case_id}")
async def get_annotation(
    case_id: str,
    user: UserPayload = Depends(get_current_user)
):
    """
    Retrieve annotation for a specific case.
    """
    annotation = redis_service.get_annotation(case_id)
    if not annotation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Annotation not found"
        )
    return annotation
