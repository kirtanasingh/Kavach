from enum import Enum
from typing import List, Optional, Any
from pydantic import BaseModel, Field

class ScanStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    PROCESSED = "processed"
    COMPLETED = "completed"
    FLAGGED = "flagged"
    MANUAL_REVIEW = "manual_review"

class TriageScore(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class UserPayload(BaseModel):
    user_id: str
    farm_id: str
    role: str

class ScanResultJson(BaseModel):
    disease_name: str
    confidence: float
    findings: List[str]

class FinalScanOutput(BaseModel):
    case_id: str
    status: ScanStatus
    triage_score: TriageScore
    result_json: Optional[ScanResultJson] = None

class ScanRequest(BaseModel):
    animal_type: str

class ScanResponse(BaseModel):
    scan_id: str
    status: ScanStatus
    message: str

# Alert Models
class Alert(BaseModel):
    id: str
    type: str  # compliance, withdrawal, medicine, task, approval, system
    severity: str  # urgent, warning, info
    title: str
    message: str
    created_at: str
    is_read: bool = False
    metadata: Optional[dict] = None

# Detection/VLM Models
class DetectionItem(BaseModel):
    case_id: str
    farm_id: str
    user_id: str
    status: ScanStatus
    ai_diagnosis: Optional[str] = None
    triage_score: Optional[TriageScore] = None
    confidence: Optional[float] = None
    created_at: str
    updated_at: str
    metadata: Optional[dict] = None

class AnnotationRequest(BaseModel):
    accepted: Optional[bool] = None
    review_status: Optional[str] = None
    vet_diagnosis: Optional[str] = None
    notes: Optional[str] = None

class AnnotationResponse(BaseModel):
    case_id: str
    status: str = "submitted"
    message: str
