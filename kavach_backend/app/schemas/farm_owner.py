from __future__ import annotations

from datetime import date, datetime
from typing import Dict, List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class FarmBase(BaseModel):
    farm_name: Optional[str] = None
    farm_type: Optional[str] = None
    description: Optional[str] = None
    farm_size: Optional[float] = None
    size_unit: Optional[str] = "acres"
    established_year: Optional[int] = None
    total_animals: Optional[int] = None
    primary_products: Optional[List[str]] = None
    annual_revenue: Optional[float] = None
    street_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = "India"
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class FarmCreate(FarmBase):
    farm_name: str


class FarmUpdate(FarmBase):
    pass


class FarmOut(FarmBase):
    id: UUID
    owner_user_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RiskAnswerIn(BaseModel):
    question_key: str
    answer_boolean: Optional[bool] = None
    answer_text: Optional[str] = None


class RiskAssessmentSubmit(BaseModel):
    answers: List[RiskAnswerIn]
    score_snapshot: Optional[int] = None


class RiskAssessmentOut(BaseModel):
    id: UUID
    farm_id: UUID
    question_key: str
    answer_boolean: Optional[bool]
    answer_text: Optional[str]
    score_snapshot: Optional[int]
    completed_at: Optional[datetime]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RiskProfileQnAIn(BaseModel):
    farm_name: str = Field(min_length=2)
    location_city_village: str = Field(min_length=2)
    location_state: str = Field(min_length=2)
    animal_count: int = Field(ge=1)
    animal_types: List[str] = Field(min_length=1)
    water_source: Literal["well", "river", "municipal", "borewell", "mixed", "other"]
    feeding_system: Literal["manual", "automated", "grazing", "mixed"]
    vaccination_status: Literal["regular", "irregular", "unknown"]
    recent_disease: bool
    recent_disease_details: Optional[str] = None
    waste_management: Literal["scientific", "basic", "open_disposal", "unknown"]
    vet_service_usage: Literal["frequent", "rare", "none"]


class RiskProfileStatusOut(BaseModel):
    exists: bool
    is_complete: bool
    completion_percent: int
    risk_score: Optional[int] = None
    risk_level: Optional[str] = None
    updated_at: Optional[datetime] = None


class RiskRecommendationOut(BaseModel):
    code: str
    title: str
    message: str
    priority: Literal["high", "medium", "low"]


class RiskProfileOut(BaseModel):
    id: UUID
    farm_id: UUID
    farm_name: str
    location_city_village: str
    location_state: str
    animal_count: int
    animal_types: List[str]
    water_source: str
    feeding_system: str
    vaccination_status: str
    recent_disease: bool
    recent_disease_details: Optional[str] = None
    waste_management: str
    vet_service_usage: str
    completion_percent: int
    risk_score: Optional[int] = None
    risk_level: Optional[str] = None
    top_risk_factors: Optional[List[str]] = None
    is_draft: bool
    submitted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RiskProfileInsightsOut(BaseModel):
    risk_score: int
    risk_level: str
    top_risk_factors: List[str]
    recommendations: List[RiskRecommendationOut]
    dashboard_flags: Dict[str, bool]


class AnimalBase(BaseModel):
    tag_number: str
    animal_name: Optional[str] = None
    species: str
    breed: Optional[str] = None
    age_months: Optional[int] = None
    age_text: Optional[str] = None
    health_status: Optional[str] = "healthy"
    vaccination_status: Optional[str] = "unknown"
    last_checkup_at: Optional[date] = None
    notes: Optional[str] = None


class AnimalCreate(AnimalBase):
    pass


class AnimalUpdate(BaseModel):
    animal_name: Optional[str] = None
    breed: Optional[str] = None
    age_months: Optional[int] = None
    age_text: Optional[str] = None
    health_status: Optional[str] = None
    vaccination_status: Optional[str] = None
    last_checkup_at: Optional[date] = None
    notes: Optional[str] = None


class AnimalOut(AnimalBase):
    id: UUID
    farm_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    assigned_to_name: Optional[str] = None
    priority: Optional[str] = "medium"
    status: Optional[str] = "pending"
    category: Optional[str] = None
    due_at: Optional[datetime] = None
    reference_url: Optional[str] = None
    notes: Optional[str] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assigned_to_name: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    category: Optional[str] = None
    due_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None


class TaskOut(TaskBase):
    id: UUID
    farm_id: UUID
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TreatmentBase(BaseModel):
    animal_id: Optional[UUID] = None
    diagnosis: str
    medication: str
    dosage: Optional[str] = None
    route: Optional[str] = None
    prescribed_by_name: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    duration_days: Optional[int] = None
    status: Optional[str] = "active"
    withdrawal_days: Optional[int] = 0
    notes: Optional[str] = None


class TreatmentCreate(TreatmentBase):
    pass


class TreatmentUpdate(BaseModel):
    diagnosis: Optional[str] = None
    medication: Optional[str] = None
    dosage: Optional[str] = None
    route: Optional[str] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    withdrawal_days: Optional[int] = None
    notes: Optional[str] = None


class TreatmentOut(TreatmentBase):
    id: UUID
    farm_id: UUID
    prescribed_by_user_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WithdrawalCreate(BaseModel):
    animal_id: Optional[UUID] = None
    treatment_id: Optional[UUID] = None
    medicine_name: str
    administered_at: datetime
    withdrawal_days: int = Field(ge=0)
    notes: Optional[str] = None


class CollectionAttempt(BaseModel):
    collection_attempted_at: datetime
    collection_result: str
    notes: Optional[str] = None


class WithdrawalOut(BaseModel):
    id: UUID
    farm_id: UUID
    animal_id: Optional[UUID]
    treatment_id: Optional[UUID]
    medicine_name: str
    administered_at: datetime
    withdrawal_days: int
    safe_after_at: Optional[datetime]
    collection_attempted_at: Optional[datetime]
    collection_result: Optional[str]
    violation_flag: bool
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AlertOut(BaseModel):
    id: UUID
    farm_id: UUID
    type: str
    severity: str
    title: str
    message: Optional[str]
    metadata: Optional[dict] = Field(default=None, alias="metadata_json")
    is_read: bool
    resolved_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class AlertMarkRead(BaseModel):
    alert_ids: List[UUID]


class FarmDashboardSummary(BaseModel):
    farm: Optional[FarmOut]
    total_animals: int
    healthy_animals: int
    sick_animals: int
    pending_tasks: int
    overdue_tasks: int
    active_treatments: int
    pending_withdrawals: int
    violation_count: int
    unread_alerts: int


class VetOptionOut(BaseModel):
    vet_user_id: UUID
    vet_name: str
    email: Optional[str] = None
    phone_number: Optional[str] = None


class AppointmentRequestCreate(BaseModel):
    vet_user_id: UUID
    appointment_type: str = "routine"
    preferred_datetime: datetime
    reason_notes: str
    duration_minutes: int = Field(default=60, ge=15, le=240)


class AppointmentRequestOut(BaseModel):
    id: UUID
    vet_user_id: UUID
    vet_name: Optional[str] = None
    farm_id: UUID
    appointment_type: str
    scheduled_at: datetime
    status: str
    reason: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
