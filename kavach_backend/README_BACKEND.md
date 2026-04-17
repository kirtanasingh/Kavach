# Kavach Animal Disease Detection Microservice (Person B)

This is a FastAPI-based AI microservice for animal disease detection. It handles image preprocessing, animal validation, and diagnosis using the Groq AI API (using Llama 3.2 Vision). It is designed to work as an async microservice with Celery and Redis.

## Features

- **Clean Architecture**: Separated into routers, services, models, and workers.
- **FastAPI**: Modern, high-performance web framework.
- **Celery + Redis**: Async task processing for AI diagnosis.
- **Groq AI Integration**: For animal validation and disease diagnosis using high-speed vision models.
- **JWT Integration**: Secure extraction of `user_id`, `farm_id`, and `role` from tokens.
- **Triage Scoring**: Automatic risk assessment (LOW, MEDIUM, HIGH).
- **Alert Triggers**: Logging and stubbed API calls for high-risk cases.
- **Standardized Output**: Consistent JSON format for all results.
- **No AWS S3**: Uses Redis for caching image bytes and results.

## Prerequisites

- Python 3.9+
- Redis Server (running on localhost:6379 by default)
- Groq API Key

## Setup and Installation

1.  **Clone or extract the repository**.
2.  **Create a virtual environment**:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
3.  **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
4.  **Configure environment variables**:
    Copy `.env.example` to `.env` and fill in your `GROQ_API_KEY` and `SECRET_KEY`.
    ```bash
    cp .env.example .env
    ```

## Running the Microservice

1.  **Start the Redis server** (if not already running).
2.  **Start the Celery worker**:
    ```bash
    celery -A app.worker.celery_worker worker --loglevel=info
    ```
3.  **Start the FastAPI application**:
    ```bash
    uvicorn main:app --reload
    ```

The API will be available at `http://localhost:8000`. You can access the interactive API documentation at `http://localhost:8000/docs`.

## API Endpoints

- `POST /api/v1/scan/{animal_type}`: Upload an image of an animal for scanning. Requires a valid JWT in the `Authorization` header.
- `GET /api/v1/scan/result/{scan_id}`: Poll for the result of a scan. Requires a valid JWT.

## Standardized Output Format

```json
{
  "case_id": "scan_id",
  "status": "completed | flagged | manual_review",
  "triage_score": "LOW | MEDIUM | HIGH",
  "result_json": {
    "disease_name": "...",
    "confidence": 0.87,
    "findings": [...]
  }
}
```
