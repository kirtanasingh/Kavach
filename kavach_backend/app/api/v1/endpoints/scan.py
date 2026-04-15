import os
import shutil
import uuid

from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from app.core.config import settings
from app.services.analysis_service import run_disease_analysis
from app.services.groq_service import validate_animal_image

router = APIRouter()

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}


async def _analyze_upload(file: UploadFile, animal_type: str) -> dict:
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
        is_valid, reason = await validate_animal_image(save_path, normalized_animal_type)
        if not is_valid:
            raise HTTPException(status_code=400, detail=reason)

        result = await run_disease_analysis(save_path, normalized_animal_type)
    finally:
        if os.path.exists(save_path):
            os.remove(save_path)

    return result


@router.post("/scan/analyze")
async def analyze(
    file: UploadFile = File(...),
    animal_type: str = Form(...),
):
    return await _analyze_upload(file, animal_type)


@router.post("/detect")
async def detect(
    file: UploadFile = File(...),
    animal_type: str = Form(...),
):
    return await _analyze_upload(file, animal_type)


@router.post("/scan/{animal_type}")
async def analyze_legacy(
    animal_type: str,
    file: UploadFile = File(...),
):
    return await _analyze_upload(file, animal_type)


@router.get("/scan/result/{scan_id}")
async def get_scan_result(scan_id: str):
    raise HTTPException(
        status_code=404,
        detail="Polling endpoint is deprecated. Use POST /api/v1/scan/analyze for direct response.",
    )