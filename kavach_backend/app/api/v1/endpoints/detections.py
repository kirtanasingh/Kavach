import uuid
from datetime import datetime
import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.core.security import get_current_user
from app.models.schemas import (
    UserPayload, AnnotationRequest, AnnotationResponse
)
from app.services.redis_service import redis_service
from app.services.postgres_service import postgres_service

router = APIRouter()
logger = logging.getLogger(__name__)

# ==================== ALERTS ENDPOINTS ====================

@router.get("/alerts")
async def get_alerts(
    user: UserPayload = Depends(get_current_user),
    limit: int = Query(100, ge=1, le=1000)
):
    """
    Retrieve alerts for the current user's farm.
    """
    try:
        return redis_service.get_alerts_for_farm(user.farm_id, limit=limit)
    except Exception:
        # Keep endpoint stable even if Redis is unavailable in local dev.
        return []

# ==================== DETECTIONS ENDPOINTS ====================

@router.get("/detections")
async def get_detections(
    status_filter: str = Query(
        "pending_review",
        alias="status",
        pattern="^(pending_review|queued|processing|processed|completed|flagged|manual_review|failed)$",
    ),
    user: UserPayload = Depends(get_current_user),
    limit: int = Query(100, ge=1, le=1000)
):
    """
    Retrieve detections for vet review workflows.
    """
    if status_filter == "pending_review":
        # Get pending review queue for vets
        if user.role not in ["Veterinarian", "Authority"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only veterinarians and authorities can view pending reviews"
            )

    try:
        return postgres_service.list_vlm_review_items(status=status_filter, limit=limit)
    except Exception:
        # Keep endpoint stable even if DB is unavailable.
        return []


@router.get("/detections/history")
async def get_detection_history(
    limit: int = Query(200, ge=1, le=1000),
):
    """Retrieve persisted farmer detection history."""
    try:
        return postgres_service.list_farmer_detection_history(limit=limit)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Detection history unavailable: {exc}") from exc


@router.delete("/detections/{detection_id}")
async def delete_detection_record(detection_id: int):
    """Delete one persisted detection record from history."""
    try:
        deleted = postgres_service.delete_detection(detection_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Detection record not found")
        return {"deleted": True, "id": detection_id}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Delete failed: {exc}") from exc


@router.delete("/detections/history")
async def clear_detection_history():
    """Clear farmer detection history from persistent storage."""
    try:
        deleted = postgres_service.clear_farmer_detection_history()
        return {"deleted": deleted}
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Clear history failed: {exc}") from exc


@router.get("/cases")
async def get_cases(
    status_filter: str | None = Query(None, alias="status"),
    limit: int = Query(200, ge=1, le=1000),
    user: UserPayload = Depends(get_current_user),
):
    """Return persisted case list derived from detection records."""
    if user.role not in ["Veterinarian", "Authority"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vet access required")

    try:
        return postgres_service.list_cases(limit=limit, status=status_filter)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Cases unavailable: {exc}") from exc


@router.get("/analytics")
async def get_detection_analytics(
    user: UserPayload = Depends(get_current_user),
):
    """Return analytics payload sourced from persisted detections."""
    if user.role not in ["Veterinarian", "Authority"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vet access required")

    try:
        return postgres_service.get_analytics()
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Analytics unavailable: {exc}") from exc

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
    
    try:
        detection_id = int(case_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="case_id must be a numeric detection id") from exc

    review_status = annotation.review_status
    if not review_status:
        if annotation.accepted is True:
            review_status = "safe"
        elif annotation.accepted is False:
            review_status = "not_safe"
        else:
            review_status = "other"

    if review_status not in {"safe", "not_safe", "other"}:
        raise HTTPException(status_code=400, detail="review_status must be safe, not_safe, or other")

    review = postgres_service.upsert_detection_review(
        detection_id=detection_id,
        review_status=review_status,
        vet_note=annotation.notes or annotation.vet_diagnosis,
    )

    # Keep optional Redis alert stream for existing UI notifications.
    alert = {
        "id": str(uuid.uuid4()),
        "type": "approval",
        "severity": "info",
        "title": f"VLM review submitted for detection {case_id}",
        "message": f"Vet {user.user_id} marked detection as {review_status}",
        "created_at": datetime.utcnow().isoformat(),
        "is_read": False,
        "farm_id": user.farm_id,
    }
    try:
        redis_service.set_alert(alert["id"], alert)
    except Exception as exc:
        # Redis is optional for alerts; do not fail review submission.
        logger.warning("Skipping Redis alert write: %s", exc)
    
    return AnnotationResponse(
        case_id=case_id,
        status="submitted",
        message=f"Review saved as {review.get('review_status', review_status)}"
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
