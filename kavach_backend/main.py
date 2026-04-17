from pathlib import Path
from dotenv import load_dotenv
import logging

# Load kavach_backend/.env explicitly so it works from any current working directory.
load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import scan, detections, ml_classify
from app.routers import auth, farm_owner, vet, authority_contact_tracing
from app.core.config import settings
from app.services.analysis_service import analyze
import app.models.auth  # noqa: F401
import app.models.farm_owner  # noqa: F401
import app.models.vet  # noqa: F401

logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$|^null$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth.router, prefix=settings.API_V1_STR, tags=["auth"])
app.include_router(scan.router, prefix=settings.API_V1_STR, tags=["scan"])
app.include_router(detections.router, prefix=settings.API_V1_STR, tags=["detections"])
app.include_router(ml_classify.router, prefix=settings.API_V1_STR, tags=["ml"])
app.include_router(farm_owner.router, prefix=settings.API_V1_STR)
app.include_router(vet.router, prefix=settings.API_V1_STR)
app.include_router(authority_contact_tracing.router, prefix=settings.API_PREFIX)


@app.on_event("startup")
async def startup() -> None:
    if not settings.verify_groq_key():
        logger.warning("GROQ_API_KEY is missing or invalid; VLM analysis will use fallback")
    else:
        logger.info("Groq API key loaded successfully")

@app.get("/")
async def root():
    return {"message": "Welcome to the Kavach Animal Disease Detection Microservice"}


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/scan")
async def scan_image(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Must be an image file")

    data = await file.read()
    if len(data) > 15 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 15MB)")

    return await analyze(data)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
