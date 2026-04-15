from pathlib import Path
from dotenv import load_dotenv
import logging

# Load kavach_backend/.env explicitly so it works from any current working directory.
load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import scan, detections, ml_classify
from app.core.config import settings

logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(scan.router, prefix=settings.API_V1_STR, tags=["scan"])
app.include_router(detections.router, prefix=settings.API_V1_STR, tags=["detections"])
app.include_router(ml_classify.router, prefix=settings.API_V1_STR, tags=["ml"])


@app.on_event("startup")
async def startup() -> None:
    if not settings.verify_groq_key():
        logger.warning("GROQ_API_KEY is missing or invalid; VLM analysis will use fallback")
    else:
        logger.info("Groq API key loaded successfully")

@app.get("/")
async def root():
    return {"message": "Welcome to the Kavach Animal Disease Detection Microservice"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
