from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class AssignmentCreate(BaseModel):
    farm_id: UUID
    notes: Optional[str] = None


class AssignmentOut(BaseModel):
    id: UUID
    vet_user_id: UUID
    farm_id: UUID
    active: bool
    assigned_at: datetime
    unassigned_at: Optional[datetime]
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class FarmSummaryForVet(BaseModel):
    farm_id: UUID
    farm_name: str
    owner_name: str
    owner_user_id: UUID
    city: Optional[str]
    state: Optional[str]
    active: bool
    assigned_at: datetime


class AppointmentCreate(BaseModel):
    farm_id: UUID
    farmer_user_id: Optional[UUID] = None
    appointment_type: str = "routine"
    scheduled_at: datetime
    duration_minutes: int = 60
    location_text: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None


class AppointmentUpdate(BaseModel):
    appointment_type: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    location_text: Optional[str] = None
    status: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    cancellation_reason: Optional[str] = None


class AppointmentOut(BaseModel):
    id: UUID
    vet_user_id: UUID
    farm_id: UUID
    farmer_user_id: Optional[UUID]
    appointment_type: str
    scheduled_at: datetime
    duration_minutes: int
    location_text: Optional[str]
    status: str
    reason: Optional[str]
    notes: Optional[str]
    cancellation_reason: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PrescriptionCreate(BaseModel):
    farm_id: UUID
    animal_id: Optional[UUID] = None
    appointment_id: Optional[UUID] = None
    diagnosis: str
    medicine_name: str
    dose: str
    frequency: Optional[str] = None
    duration_days: Optional[int] = None
    route: Optional[str] = None
    withdrawal_days: int = Field(0, ge=0)
    valid_until: Optional[date] = None
    refills_allowed: int = 0
    special_instructions: Optional[str] = None
    comments: Optional[str] = None


class PrescriptionUpdate(BaseModel):
    status: Optional[str] = None
    dose: Optional[str] = None
    frequency: Optional[str] = None
    duration_days: Optional[int] = None
    withdrawal_days: Optional[int] = None
    valid_until: Optional[date] = None
    refills_allowed: Optional[int] = None
    refills_used: Optional[int] = None
    special_instructions: Optional[str] = None
    comments: Optional[str] = None


class PrescriptionOut(BaseModel):
    id: UUID
    vet_user_id: UUID
    farm_id: UUID
    animal_id: Optional[UUID]
    appointment_id: Optional[UUID]
    diagnosis: str
    medicine_name: str
    dose: str
    frequency: Optional[str]
    duration_days: Optional[int]
    route: Optional[str]
    withdrawal_days: int
    prescribed_on: date
    valid_until: Optional[date]
    status: str
    refills_allowed: int
    refills_used: int
    special_instructions: Optional[str]
    comments: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AMULogCreate(BaseModel):
    farm_id: UUID
    animal_id: Optional[UUID] = None
    prescription_id: Optional[UUID] = None
    species: str
    drug_name: str
    drug_class: Optional[str] = None
    route: str
    dosage: Decimal = Field(gt=0)
    dosage_unit: str = "mg"
    dosage_per_kg: Optional[Decimal] = None
    purpose: str = "treatment"
    administration_date: date
    duration_days: Optional[int] = None
    withdrawal_period_days: int = Field(0, ge=0)
    batch_size: Optional[int] = None
    reminder_enabled: bool = False
    notes: Optional[str] = None


class AMULogUpdate(BaseModel):
    drug_class: Optional[str] = None
    dosage: Optional[Decimal] = None
    dosage_per_kg: Optional[Decimal] = None
    duration_days: Optional[int] = None
    withdrawal_period_days: Optional[int] = None
    batch_size: Optional[int] = None
    reminder_enabled: Optional[bool] = None
    notes: Optional[str] = None


class AMULogOut(BaseModel):
    id: UUID
    farm_id: UUID
    animal_id: Optional[UUID]
    prescription_id: Optional[UUID]
    entered_by_user_id: UUID
    species: str
    drug_name: str
    drug_class: Optional[str]
    route: str
    dosage: Decimal
    dosage_unit: str
    dosage_per_kg: Optional[Decimal]
    purpose: str
    administration_date: date
    duration_days: Optional[int]
    withdrawal_period_days: int
    safe_after_date: Optional[date]
    batch_size: Optional[int]
    reminder_enabled: bool
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AMUSummaryByDrug(BaseModel):
    drug_name: str
    drug_class: Optional[str]
    total_entries: int
    total_dosage: Decimal
    farms_affected: int


class AMUSummaryBySpecies(BaseModel):
    species: str
    total_entries: int
    drug_count: int


class MessageSend(BaseModel):
    farm_id: UUID
    farmer_user_id: UUID
    message_text: str
    attachment_url: Optional[str] = None


class MessageOut(BaseModel):
    id: UUID
    farm_id: UUID
    vet_user_id: UUID
    farmer_user_id: UUID
    sender_user_id: UUID
    sender_role: str
    message_text: str
    attachment_url: Optional[str]
    is_read: bool
    read_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class VetAlertOut(BaseModel):
    id: UUID
    vet_user_id: UUID
    farm_id: Optional[UUID]
    type: str
    severity: str
    title: str
    message: Optional[str]
    metadata: Optional[dict] = Field(default=None, alias="metadata_json")
    is_read: bool
    resolved_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True, "populate_by_name": True}


class AlertMarkRead(BaseModel):
    alert_ids: List[UUID]


class VetDashboardSummary(BaseModel):
    assigned_farms: int
    todays_appointments: int
    upcoming_appointments: int
    pending_reviews: int
    active_prescriptions: int
    amu_entries_this_month: int
    unread_messages: int
    unread_alerts: int
    amr_risk_farms: int


class FarmerDirectoryOut(BaseModel):
    farmer_user_id: UUID
    farmer_name: str
    farm_id: Optional[UUID] = None
    farm_name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    risk_score: Optional[int] = None
    risk_level: Optional[str] = None
    key_flags: List[str] = Field(default_factory=list)
