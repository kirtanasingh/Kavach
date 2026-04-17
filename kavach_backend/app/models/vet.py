import uuid

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class VetFarmAssignment(Base):
    __tablename__ = "vet_farm_assignments"
    __table_args__ = (UniqueConstraint("vet_user_id", "farm_id"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vet_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    active = Column(Boolean, nullable=False, default=True)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    unassigned_at = Column(DateTime(timezone=True))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class VetAppointment(Base):
    __tablename__ = "vet_appointments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vet_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    farmer_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    appointment_type = Column(Text, nullable=False, default="routine")
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    duration_minutes = Column(Integer, default=60)
    location_text = Column(Text)

    status = Column(Text, nullable=False, default="scheduled")
    reason = Column(Text)
    notes = Column(Text)
    cancellation_reason = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    prescriptions = relationship("Prescription", back_populates="appointment")


class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vet_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    animal_id = Column(UUID(as_uuid=True), ForeignKey("animals.id", ondelete="SET NULL"), nullable=True)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("vet_appointments.id", ondelete="SET NULL"), nullable=True)

    diagnosis = Column(Text, nullable=False)
    medicine_name = Column(Text, nullable=False)
    dose = Column(Text, nullable=False)
    frequency = Column(Text)
    duration_days = Column(Integer)
    route = Column(Text)
    withdrawal_days = Column(Integer, default=0)

    prescribed_on = Column(Date, nullable=False, server_default=func.current_date())
    valid_until = Column(Date)
    status = Column(Text, nullable=False, default="active")
    refills_allowed = Column(Integer, default=0)
    refills_used = Column(Integer, default=0)

    special_instructions = Column(Text)
    comments = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    appointment = relationship("VetAppointment", back_populates="prescriptions")
    amu_logs = relationship("AMULog", back_populates="prescription")


class AMULog(Base):
    __tablename__ = "amu_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    animal_id = Column(UUID(as_uuid=True), ForeignKey("animals.id", ondelete="SET NULL"), nullable=True)
    prescription_id = Column(UUID(as_uuid=True), ForeignKey("prescriptions.id", ondelete="SET NULL"), nullable=True)
    entered_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    species = Column(Text, nullable=False)
    drug_name = Column(Text, nullable=False)
    drug_class = Column(Text)
    route = Column(Text, nullable=False)
    dosage = Column(Numeric(10, 3), nullable=False)
    dosage_unit = Column(Text, nullable=False, default="mg")
    dosage_per_kg = Column(Numeric(10, 3))

    purpose = Column(Text, nullable=False)
    administration_date = Column(Date, nullable=False)
    duration_days = Column(Integer)
    withdrawal_period_days = Column(Integer, default=0)
    safe_after_date = Column(Date)

    batch_size = Column(Integer)
    reminder_enabled = Column(Boolean, default=False)
    reminder_sent_at = Column(DateTime(timezone=True))

    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    prescription = relationship("Prescription", back_populates="amu_logs")


class VetMessage(Base):
    __tablename__ = "vet_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    vet_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    farmer_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    sender_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    sender_role = Column(Text, nullable=False)
    message_text = Column(Text, nullable=False)
    attachment_url = Column(Text)
    is_read = Column(Boolean, nullable=False, default=False)
    read_at = Column(DateTime(timezone=True))

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class VetAlert(Base):
    __tablename__ = "vet_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vet_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id", ondelete="CASCADE"), nullable=True)

    type = Column(Text, nullable=False)
    severity = Column(Text, nullable=False, default="medium")
    title = Column(Text, nullable=False)
    message = Column(Text)
    metadata_json = Column("metadata", JSONB, default=dict)

    is_read = Column(Boolean, nullable=False, default=False)
    resolved_at = Column(DateTime(timezone=True))

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
