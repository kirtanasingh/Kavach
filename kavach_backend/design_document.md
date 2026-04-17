# FastAPI AI Microservice Design Document

## 1. Introduction

This document outlines the design and implementation plan for the FastAPI-based AI microservice for animal disease detection. The service will handle AI processing, image preprocessing, and result storage, integrating with a separate authentication and database service (Person A microservice).

## 2. Architecture Overview

The microservice will follow a clean architecture pattern, separating concerns into distinct modules:

```
kavach_backend/
├── main.py                 # FastAPI application entry point
├── requirements.txt        # Python dependencies
├── Dockerfile              # Dockerization (optional, for future deployment)
├── .env.example            # Environment variables example
├── app/
│   ├── __init__.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py       # Application settings and configurations
│   │   ├── security.py     # JWT decoding and dependency
│   │   └── exceptions.py   # Custom exception handling
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py      # Pydantic models for request/response/internal data
│   ├── services/
│   │   ├── __init__.py
│   │   ├── redis_service.py      # Redis client and operations
│   │   ├── image_service.py      # Image preprocessing (resize, enhance, etc.)
│   │   ├── gemini_service.py     # Gemini API integration (validate, diagnose)
│   │   └── analysis_service.py   # Triage scoring, alert triggering, status logic
│   ├── api/
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       └── endpoints/
│   │           ├── __init__.py
│   │           └── scan.py       # API routes for /scan and /scan/result
│   └── worker/
│       ├── __init__.py
│       └── celery_worker.py  # Celery task definitions
```

## 3. Component Breakdown and Implementation Details

### 3.1. Core Module (`app/core/`)

*   **`config.py`**: Manages environment variables and application settings (e.g., Redis URL, Gemini API key, JWT secret).
*   **`security.py`**: Implements JWT decoding using `PyJWT` and defines a `get_current_user` dependency to extract `user_id`, `farm_id`, and `role` from the token.
*   **`exceptions.py`**: Defines custom exceptions for better error handling.

### 3.2. Models Module (`app/models/`)

*   **`schemas.py`**: Contains Pydantic models for:
    *   `User` (from JWT payload)
    *   `ScanRequest` (for image upload)
    *   `ScanResult` (internal processing result)
    *   `FinalScanOutput` (standardized output format for API)
    *   `ScanStatus` (enum for status: `queued`, `processing`, `processed`, `manual_review`, `flagged`)
    *   `TriageScore` (enum for score: `LOW`, `MEDIUM`, `HIGH`)

### 3.3. Services Module (`app/services/`)

*   **`redis_service.py`**: Provides functions to interact with Redis, including:
    *   Storing and retrieving cached image bytes.
    *   Storing and retrieving `ScanResult` objects.
    *   Managing scan status updates.
*   **`image_service.py`**: Handles image preprocessing:
    *   `strip_exif(image_bytes)`: Removes EXIF data.
    *   `resize_image(image_bytes)`: Resizes image to a standard dimension.
    *   `enhance_image(image_bytes)`: Applies basic image enhancements.
    *   All functions will operate on image bytes, returning processed bytes.
*   **`gemini_service.py`**: Integrates with the Gemini API:
    *   `validate_animal(image_bytes, animal_type)`: Calls Gemini to validate the animal type.
    *   `diagnose_animal(image_bytes, animal_type)`: Calls Gemini for disease diagnosis, returning raw AI output.
*   **`analysis_service.py`**: Contains the core logic for result analysis:
    *   `compute_triage_score(diagnosis_result, confidence)`: Determines `LOW`, `MEDIUM`, `HIGH` based on severity keywords and confidence.
    *   `trigger_alert(scan_id, farm_id, triage_score)`: Logs an alert and stubs a future API call if `triage_score` is `HIGH`.
    *   `update_scan_status(scan_id, current_status, confidence, triage_score)`: Updates the scan status based on processing stage, confidence, and triage score.

### 3.4. API Module (`app/api/v1/endpoints/`)

*   **`scan.py`**: Defines FastAPI routes:
    *   `POST /scan/{animal_type}`:
        *   Receives image upload.
        *   Decodes JWT to get `user_id`, `farm_id`, `role`.
        *   Performs image preprocessing.
        *   Calls `gemini_service.validate_animal`.
        *   Caches image bytes in Redis.
        *   Enqueues `celery_worker.diagnose_task`.
        *   Returns initial `ScanStatus` (queued) and `scan_id`.
    *   `GET /scan/result/{scan_id}`:
        *   Polls Redis for `ScanResult`.
        *   Returns `FinalScanOutput` if available, otherwise current status.

### 3.5. Worker Module (`app/worker/`)

*   **`celery_worker.py`**: Defines Celery tasks:
    *   `diagnose_task(scan_id, animal_type, farm_id)`:
        *   Retrieves cached image bytes from Redis.
        *   Calls `gemini_service.diagnose_animal`.
        *   Parses Gemini output into `ScanResult`.
        *   Calls `analysis_service.compute_triage_score`.
        *   Calls `analysis_service.trigger_alert` if needed.
        *   Calls `analysis_service.update_scan_status`.
        *   Stores the final `ScanResult` in Redis.

## 4. JWT Integration

*   The `get_current_user` dependency will be applied to protected routes.
*   It will extract `user_id`, `farm_id`, and `role` from the JWT payload.
*   `farm_id` will *always* be sourced from the JWT, not from user input.

## 5. Triage Scoring and Alert Trigger

*   **Triage Scoring**: A function in `analysis_service.py` will assign `LOW`, `MEDIUM`, or `HIGH` based on keywords in the diagnosis and confidence levels.
    *   `HIGH`: severe/critical keywords OR confidence > 0.85.
    *   `MEDIUM`: moderate keywords.
    *   `LOW`: mild/healthy keywords.
*   **Alert Trigger**: If `triage_score` is `HIGH`, an alert will be logged, and a placeholder function will simulate an external API call.

## 6. Status Handling

*   Statuses will transition as follows:
    *   `queued` (initial state after upload)
    *   `processing` (when Celery task starts)
    *   `processed` (after diagnosis, before triage)
    *   `manual_review` (if confidence is low)
    *   `flagged` (if triage score is HIGH)

## 7. Storage

*   **Redis**: Used for:
    *   Caching uploaded image bytes temporarily.
    *   Storing intermediate and final `ScanResult` objects.
    *   Managing scan statuses.
*   **Local Temp Storage**: Not strictly required if image bytes are directly passed and cached in Redis. If needed for debugging or specific image processing libraries, `/tmp/scans/{scan_id}.jpg` will be used, but the primary method will be Redis caching.

## 8. Removal of AWS S3

All `boto3` imports and S3-related logic will be completely removed. Image handling will be confined to in-memory operations and Redis caching.

## 9. Final Output Format

All API responses for scan results will adhere to the specified JSON structure:

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

## 10. Development Environment Setup

*   Python 3.9+
*   `pip` for dependency management
*   `Redis` server running locally or accessible via URL
*   `Celery` broker (e.g., Redis) and worker

This design ensures a modular, maintainable, and scalable microservice that meets all specified requirements.
