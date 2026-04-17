import os
import shutil
import uuid
import asyncio

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends

from app.core.config import settings
from app.core.security import get_current_user
from app.models.schemas import UserPayload
from app.services.analysis_service import run_disease_analysis
from app.services.groq_service import validate_animal_image
from app.services.postgres_service import postgres_service

router = APIRouter()

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}


async def _analyze_upload(file: UploadFile, animal_type: str, farmer_id: int | None = None) -> dict:
    print("📥 Request received")
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")

    normalized_animal_type = animal_type.strip().lower()
    if normalized_animal_type not in {"pig", "poultry", "cattle"}:
        raise HTTPException(status_code=400, detail="Only pig, poultry, and cattle are supported.")

    os.makedirs(settings.upload_dir, exist_ok=True)
    ext = (file.filename or "upload.jpg").rsplit(".", 1)[-1]
    save_path = os.path.join(settings.upload_dir, f"{uuid.uuid4()}.{ext}")

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        is_valid, reason = True, "ok"
        if settings.ENABLE_VLM_VALIDATION:
            try:
                is_valid, reason = await asyncio.wait_for(
                    validate_animal_image(save_path, normalized_animal_type),
                    timeout=float(settings.GROQ_TIMEOUT_SECONDS),
                )
            except asyncio.TimeoutError:
                is_valid, reason = False, "Image validation timed out; continued with scan."

        result = await run_disease_analysis(save_path, normalized_animal_type)
        if not is_valid:
            # Soft-fail validation to avoid false negatives blocking real farm uploads.
            result["validation_warning"] = reason

        # Newly created detections should always await vet confirmation first.
        status = "pending_review"
        severity = str(result.get("severity") or "unknown")
        predicted = str(result.get("disease") or "unknown")
        recommendation = str(result.get("recommendation") or "")
        ml_pred = result.get("ml", {}).get("top_prediction", {}).get("label")

        saved = postgres_service.save_detection_record(
            species=normalized_animal_type,
            predicted_label=str(ml_pred or predicted),
            confidence=float(result.get("confidence") or 0.0),
            severity=severity,
            status=status,
            recommendation=recommendation,
            image_url=None,
            farmer_id=farmer_id,
        )

        result["detection_id"] = saved.get("id")
        result["case_id"] = saved.get("case", {}).get("id")
        result["status"] = status
        result["review_status"] = "pending"
        result["created_at"] = saved.get("created_at")
    finally:
        if os.path.exists(save_path):
            os.remove(save_path)

    return result


@router.post("/scan/analyze")
async def analyze(
    file: UploadFile = File(...),
    animal_type: str = Form(...),
    user: UserPayload = Depends(get_current_user),
):
    farmer_id = postgres_service.resolve_or_create_farmer_scope_id(user.user_id)
    return await _analyze_upload(file, animal_type, farmer_id)


@router.post("/detect")
async def detect(
    file: UploadFile = File(...),
    animal_type: str = Form(...),
    user: UserPayload = Depends(get_current_user),
):
    farmer_id = postgres_service.resolve_or_create_farmer_scope_id(user.user_id)
    return await _analyze_upload(file, animal_type, farmer_id)


@router.post("/scan/{animal_type}")
async def analyze_legacy(
    animal_type: str,
    file: UploadFile = File(...),
    user: UserPayload = Depends(get_current_user),
):
    farmer_id = postgres_service.resolve_or_create_farmer_scope_id(user.user_id)
    return await _analyze_upload(file, animal_type, farmer_id)


@router.get("/scan/result/{scan_id}")
async def get_scan_result(scan_id: str):
    raise HTTPException(
        status_code=404,
        detail="Polling endpoint is deprecated. Use POST /api/v1/scan/analyze for direct response.",
    )