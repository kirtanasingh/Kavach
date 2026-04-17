import uuid

from sqlalchemy import (
    ARRAY,
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Farm(Base):
    __tablename__ = "farms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)

    farm_name = Column(Text, nullable=False)
    farm_type = Column(Text)
    description = Column(Text)

    farm_size = Column(Numeric(10, 2))
    size_unit = Column(Text, default="acres")
    established_year = Column(Integer)

    total_animals = Column(Integer, default=0)
    primary_products = Column(ARRAY(Text))
    annual_revenue = Column(Numeric(15, 2))

    street_address = Column(Text)
    city = Column(Text)
    state = Column(Text)
    postal_code = Column(Text)
    country = Column(Text, default="India")
    latitude = Column(Numeric(10, 7))
    longitude = Column(Numeric(10, 7))

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    animals = relationship("Animal", back_populates="farm", cascade="all, delete-orphan")
    tasks = relationship("FarmTask", back_populates="farm", cascade="all, delete-orphan")
    treatments = relationship("FarmTreatment", back_populates="farm", cascade="all, delete-orphan")
    withdrawals = relationship("WithdrawalRecord", back_populates="farm", cascade="all, delete-orphan")
    alerts = relationship("FarmAlert", back_populates="farm", cascade="all, delete-orphan")
    risk_assessments = relationship("FarmRiskAssessment", back_populates="farm", cascade="all, delete-orphan")
    risk_profiles = relationship("FarmRiskProfile", back_populates="farm", cascade="all, delete-orphan")


class FarmRiskAssessment(Base):
    __tablename__ = "farm_risk_assessments"
    __table_args__ = (UniqueConstraint("farm_id", "question_key"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    question_key = Column(Text, nullable=False)
    answer_boolean = Column(Boolean)
    answer_text = Column(Text)
    score_snapshot = Column(Integer)
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    farm = relationship("Farm", back_populates="risk_assessments")


class FarmRiskProfile(Base):
    __tablename__ = "farm_risk_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, unique=True)
    submitted_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    farm_name = Column(Text, nullable=False)
    location_city_village = Column(Text, nullable=False)
    location_state = Column(Text, nullable=False)
    animal_count = Column(Integer, nullable=False)
    animal_types = Column(ARRAY(Text), nullable=False, default=list)
    water_source = Column(Text, nullable=False)
    feeding_system = Column(Text, nullable=False)
    vaccination_status = Column(Text, nullable=False)
    recent_disease = Column(Boolean, nullable=False, default=False)
    recent_disease_details = Column(Text)
    waste_management = Column(Text, nullable=False)
    vet_service_usage = Column(Text, nullable=False)

    completion_percent = Column(Integer, nullable=False, default=0)
    risk_score = Column(Integer)
    risk_level = Column(Text)
    top_risk_factors = Column(ARRAY(Text), default=list)
    recommendations_json = Column(JSONB, default=list)
    dashboard_flags = Column(JSONB, default=dict)

    is_draft = Column(Boolean, nullable=False, default=True)
    submitted_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    farm = relationship("Farm", back_populates="risk_profiles")


class Animal(Base):
    __tablename__ = "animals"
    __table_args__ = (UniqueConstraint("farm_id", "tag_number"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)

    tag_number = Column(Text, nullable=False)
    animal_name = Column(Text)
    species = Column(Text, nullable=False)
    breed = Column(Text)
    age_months = Column(Integer)
    age_text = Column(Text)

    health_status = Column(Text, default="healthy")
    vaccination_status = Column(Text, default="unknown")
    last_checkup_at = Column(Date)
    notes = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    farm = relationship("Farm", back_populates="animals")
    treatments = relationship("FarmTreatment", back_populates="animal")
    withdrawals = relationship("WithdrawalRecord", back_populates="animal")


class FarmTask(Base):
    __tablename__ = "farm_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)

    title = Column(Text, nullable=False)
    description = Column(Text)
    assigned_to_name = Column(Text)
    assigned_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    priority = Column(Text, default="medium")
    status = Column(Text, default="pending")
    category = Column(Text)

    due_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    reference_url = Column(Text)
    notes = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    farm = relationship("Farm", back_populates="tasks")


class FarmTreatment(Base):
    __tablename__ = "farm_treatments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    animal_id = Column(UUID(as_uuid=True), ForeignKey("animals.id", ondelete="SET NULL"), nullable=True)

    diagnosis = Column(Text, nullable=False)
    medication = Column(Text, nullable=False)
    dosage = Column(Text)
    route = Column(Text)

    prescribed_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    prescribed_by_name = Column(Text)

    start_date = Column(Date, nullable=False)
    end_date = Column(Date)
    duration_days = Column(Integer)

    status = Column(Text, default="active")
    withdrawal_days = Column(Integer, default=0)
    notes = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    farm = relationship("Farm", back_populates="treatments")
    animal = relationship("Animal", back_populates="treatments")
    withdrawals = relationship("WithdrawalRecord", back_populates="treatment")


class WithdrawalRecord(Base):
    __tablename__ = "withdrawal_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    animal_id = Column(UUID(as_uuid=True), ForeignKey("animals.id", ondelete="SET NULL"), nullable=True)
    treatment_id = Column(UUID(as_uuid=True), ForeignKey("farm_treatments.id", ondelete="SET NULL"), nullable=True)

    medicine_name = Column(Text, nullable=False)
    administered_at = Column(DateTime(timezone=True), nullable=False)
    withdrawal_days = Column(Integer, nullable=False, default=0)
    safe_after_at = Column(DateTime(timezone=True))

    collection_attempted_at = Column(DateTime(timezone=True))
    collection_result = Column(Text)
    violation_flag = Column(Boolean, default=False)
    notes = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    farm = relationship("Farm", back_populates="withdrawals")
    animal = relationship("Animal", back_populates="withdrawals")
    treatment = relationship("FarmTreatment", back_populates="withdrawals")


class FarmAlert(Base):
    __tablename__ = "farm_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)

    type = Column(Text, nullable=False)
    severity = Column(Text, default="medium")
    title = Column(Text, nullable=False)
    message = Column(Text)
    metadata_json = Column("metadata", JSONB, default=dict)

    is_read = Column(Boolean, default=False)
    resolved_at = Column(DateTime(timezone=True))

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    farm = relationship("Farm", back_populates="alerts")
