from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional
from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auth import User
from app.models.farm_owner import (
    Animal,
    Farm,
    FarmAlert,
    FarmRiskAssessment,
    FarmRiskProfile,
    FarmTask,
    FarmTreatment,
    WithdrawalRecord,
)
from app.models.vet import VetAlert, VetAppointment, VetFarmAssignment
from app.schemas.farm_owner import (
    AnimalCreate,
    AnimalUpdate,
    AppointmentRequestCreate,
    AppointmentRequestOut,
    CollectionAttempt,
    FarmCreate,
    FarmDashboardSummary,
    RiskProfileInsightsOut,
    RiskProfileQnAIn,
    RiskProfileStatusOut,
    FarmUpdate,
    RiskAssessmentSubmit,
    TaskCreate,
    TaskUpdate,
    TreatmentCreate,
    TreatmentUpdate,
    VetOptionOut,
    WithdrawalCreate,
)


PRIMARY_VET_EMAIL = "kirtana.singh@vit.edu.in"


async def get_farm_by_owner(db: AsyncSession, owner_user_id: UUID) -> Optional[Farm]:
    result = await db.execute(select(Farm).where(Farm.owner_user_id == owner_user_id))
    return result.scalar_one_or_none()


async def create_farm(db: AsyncSession, owner_user_id: UUID, data: FarmCreate) -> Farm:
    farm = Farm(owner_user_id=owner_user_id, **data.model_dump(exclude_none=True))
    db.add(farm)
    await db.flush()
    await db.refresh(farm)
    return farm


async def update_farm(db: AsyncSession, farm: Farm, data: FarmUpdate) -> Farm:
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(farm, field, value)
    await db.flush()
    await db.refresh(farm)
    return farm


async def submit_risk_assessment(
    db: AsyncSession, farm_id: UUID, data: RiskAssessmentSubmit
) -> List[FarmRiskAssessment]:
    now = datetime.now(timezone.utc)
    results: List[FarmRiskAssessment] = []

    for answer in data.answers:
        existing_result = await db.execute(
            select(FarmRiskAssessment).where(
                FarmRiskAssessment.farm_id == farm_id,
                FarmRiskAssessment.question_key == answer.question_key,
            )
        )
        existing = existing_result.scalar_one_or_none()

        if existing:
            existing.answer_boolean = answer.answer_boolean
            existing.answer_text = answer.answer_text
            existing.score_snapshot = data.score_snapshot
            existing.completed_at = now
            results.append(existing)
        else:
            row = FarmRiskAssessment(
                farm_id=farm_id,
                question_key=answer.question_key,
                answer_boolean=answer.answer_boolean,
                answer_text=answer.answer_text,
                score_snapshot=data.score_snapshot,
                completed_at=now,
            )
            db.add(row)
            results.append(row)

    await db.flush()

    # Ensure IDs are present for newly inserted rows.
    for row in results:
        await db.refresh(row)

    return results


async def get_risk_assessment(db: AsyncSession, farm_id: UUID) -> List[FarmRiskAssessment]:
    result = await db.execute(
        select(FarmRiskAssessment)
        .where(FarmRiskAssessment.farm_id == farm_id)
        .order_by(FarmRiskAssessment.created_at.asc())
    )
    return list(result.scalars().all())


def _calculate_risk_profile(payload: RiskProfileQnAIn) -> Dict[str, object]:
    factors: Dict[str, int] = {
        "vaccination": {"regular": 0, "irregular": 20, "unknown": 25}[payload.vaccination_status],
        "recent_disease": 20 if payload.recent_disease else 0,
        "water_source": {
            "municipal": 5,
            "well": 10,
            "borewell": 10,
            "river": 15,
            "mixed": 15,
            "other": 15,
        }[payload.water_source],
        "feeding_system": {
            "automated": 5,
            "manual": 10,
            "mixed": 10,
            "grazing": 15,
        }[payload.feeding_system],
        "waste_management": {
            "scientific": 0,
            "basic": 10,
            "open_disposal": 20,
            "unknown": 15,
        }[payload.waste_management],
        "vet_service_usage": {"frequent": 0, "rare": 15, "none": 25}[payload.vet_service_usage],
        "animal_count": 5 if payload.animal_count <= 20 else 10 if payload.animal_count <= 100 else 15,
    }

    score = max(0, min(100, sum(factors.values())))
    if score < 30:
        level = "low"
    elif score < 60:
        level = "medium"
    else:
        level = "high"

    factor_labels = {
        "vaccination": "Vaccination schedule is irregular or unknown",
        "recent_disease": "Recent disease history reported",
        "water_source": "Water source has elevated contamination risk",
        "feeding_system": "Feeding system can increase exposure risk",
        "waste_management": "Waste handling needs stronger biosecurity",
        "vet_service_usage": "Veterinary engagement is low",
        "animal_count": "High herd/flock size increases spread risk",
    }

    top_risk_factors = [
        factor_labels[key]
        for key, value in sorted(factors.items(), key=lambda item: item[1], reverse=True)
        if value >= 15
    ][:3]

    recommendations = []
    if payload.vaccination_status != "regular":
        recommendations.append({
            "code": "vaccination_plan",
            "title": "Stabilize Vaccination Calendar",
            "message": "Create and follow a monthly vaccination calendar with batch-level tracking.",
            "priority": "high",
        })
    if payload.vet_service_usage in {"rare", "none"}:
        recommendations.append({
            "code": "vet_coverage",
            "title": "Increase Veterinary Visits",
            "message": "Schedule preventive vet rounds and maintain a clinical escalation protocol.",
            "priority": "high" if payload.vet_service_usage == "none" else "medium",
        })
    if payload.water_source in {"river", "mixed", "other"}:
        recommendations.append({
            "code": "water_hygiene",
            "title": "Improve Water Hygiene",
            "message": "Add filtration/chlorination and run periodic water quality tests.",
            "priority": "medium",
        })
    if payload.waste_management in {"open_disposal", "unknown"}:
        recommendations.append({
            "code": "waste_biosecurity",
            "title": "Upgrade Waste Management",
            "message": "Adopt controlled composting/disposal zones with daily sanitation checks.",
            "priority": "high",
        })

    if not recommendations:
        recommendations.append({
            "code": "maintain_controls",
            "title": "Maintain Current Controls",
            "message": "Current controls are strong. Continue routine audits and staff refresher training.",
            "priority": "low",
        })

    dashboard_flags = {
        "show_vaccination_cta": payload.vaccination_status != "regular",
        "show_vet_contact_cta": payload.vet_service_usage == "none",
        "show_water_advisory": payload.water_source in {"river", "mixed", "other"},
        "show_outbreak_watch": payload.recent_disease,
        "high_risk_mode": level == "high",
    }

    return {
        "score": score,
        "level": level,
        "top_risk_factors": top_risk_factors,
        "recommendations": recommendations,
        "dashboard_flags": dashboard_flags,
    }


def _completion_percent(payload: RiskProfileQnAIn) -> int:
    required_checks = [
        bool(payload.farm_name.strip()),
        bool(payload.location_city_village.strip()),
        bool(payload.location_state.strip()),
        payload.animal_count > 0,
        len(payload.animal_types) > 0,
        bool(payload.water_source),
        bool(payload.feeding_system),
        bool(payload.vaccination_status),
        payload.recent_disease is not None,
        (not payload.recent_disease) or bool((payload.recent_disease_details or "").strip()),
        bool(payload.waste_management),
        bool(payload.vet_service_usage),
    ]
    return int(round((sum(1 for item in required_checks if item) / len(required_checks)) * 100))


async def get_risk_profile_status(db: AsyncSession, farm_id: UUID) -> RiskProfileStatusOut:
    result = await db.execute(select(FarmRiskProfile).where(FarmRiskProfile.farm_id == farm_id))
    profile = result.scalar_one_or_none()

    if not profile:
        return RiskProfileStatusOut(
            exists=False,
            is_complete=False,
            completion_percent=0,
            risk_score=None,
            risk_level=None,
            updated_at=None,
        )

    return RiskProfileStatusOut(
        exists=True,
        is_complete=not profile.is_draft and profile.completion_percent == 100,
        completion_percent=profile.completion_percent,
        risk_score=profile.risk_score,
        risk_level=profile.risk_level,
        updated_at=profile.updated_at,
    )


async def get_risk_profile(db: AsyncSession, farm_id: UUID) -> Optional[FarmRiskProfile]:
    result = await db.execute(select(FarmRiskProfile).where(FarmRiskProfile.farm_id == farm_id))
    return result.scalar_one_or_none()


async def save_risk_profile(
    db: AsyncSession,
    farm_id: UUID,
    user_id: UUID,
    payload: RiskProfileQnAIn,
    submit: bool,
) -> FarmRiskProfile:
    result = await db.execute(select(FarmRiskProfile).where(FarmRiskProfile.farm_id == farm_id))
    profile = result.scalar_one_or_none()

    score_data = _calculate_risk_profile(payload)
    completion = _completion_percent(payload)
    now = datetime.now(timezone.utc)

    values = {
        "submitted_by_user_id": user_id,
        "farm_name": payload.farm_name.strip(),
        "location_city_village": payload.location_city_village.strip(),
        "location_state": payload.location_state.strip(),
        "animal_count": payload.animal_count,
        "animal_types": payload.animal_types,
        "water_source": payload.water_source,
        "feeding_system": payload.feeding_system,
        "vaccination_status": payload.vaccination_status,
        "recent_disease": payload.recent_disease,
        "recent_disease_details": payload.recent_disease_details,
        "waste_management": payload.waste_management,
        "vet_service_usage": payload.vet_service_usage,
        "completion_percent": completion,
        "risk_score": score_data["score"],
        "risk_level": score_data["level"],
        "top_risk_factors": score_data["top_risk_factors"],
        "recommendations_json": score_data["recommendations"],
        "dashboard_flags": score_data["dashboard_flags"],
        "is_draft": not submit,
        "submitted_at": now if submit else None,
    }

    if profile:
        for field, value in values.items():
            setattr(profile, field, value)
    else:
        profile = FarmRiskProfile(farm_id=farm_id, **values)
        db.add(profile)

    await db.flush()
    await db.refresh(profile)
    return profile


async def get_risk_profile_insights(db: AsyncSession, farm_id: UUID) -> Optional[RiskProfileInsightsOut]:
    result = await db.execute(select(FarmRiskProfile).where(FarmRiskProfile.farm_id == farm_id))
    profile = result.scalar_one_or_none()
    if not profile or profile.risk_score is None or not profile.risk_level:
        return None

    return RiskProfileInsightsOut(
        risk_score=profile.risk_score,
        risk_level=profile.risk_level,
        top_risk_factors=profile.top_risk_factors or [],
        recommendations=profile.recommendations_json or [],
        dashboard_flags=profile.dashboard_flags or {},
    )


async def list_animals(
    db: AsyncSession,
    farm_id: UUID,
    species: Optional[str] = None,
    health_status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[Animal]:
    stmt = select(Animal).where(Animal.farm_id == farm_id)
    if species:
        stmt = stmt.where(Animal.species == species)
    if health_status:
        stmt = stmt.where(Animal.health_status == health_status)

    result = await db.execute(
        stmt.order_by(Animal.created_at.desc()).offset(skip).limit(limit)
    )
    return list(result.scalars().all())


async def get_animal(db: AsyncSession, farm_id: UUID, animal_id: UUID) -> Optional[Animal]:
    result = await db.execute(
        select(Animal).where(Animal.id == animal_id, Animal.farm_id == farm_id)
    )
    return result.scalar_one_or_none()


async def create_animal(db: AsyncSession, farm_id: UUID, data: AnimalCreate) -> Animal:
    animal = Animal(farm_id=farm_id, **data.model_dump())
    db.add(animal)
    await db.execute(
        update(Farm).where(Farm.id == farm_id).values(total_animals=Farm.total_animals + 1)
    )
    await db.flush()
    await db.refresh(animal)
    return animal


async def update_animal(db: AsyncSession, animal: Animal, data: AnimalUpdate) -> Animal:
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(animal, field, value)
    await db.flush()
    await db.refresh(animal)
    return animal


async def delete_animal(db: AsyncSession, animal: Animal) -> None:
    farm_id = animal.farm_id
    await db.delete(animal)
    await db.execute(
        update(Farm)
        .where(Farm.id == farm_id)
        .values(total_animals=func.greatest(Farm.total_animals - 1, 0))
    )


async def list_tasks(
    db: AsyncSession,
    farm_id: UUID,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[FarmTask]:
    stmt = select(FarmTask).where(FarmTask.farm_id == farm_id)
    if status:
        stmt = stmt.where(FarmTask.status == status)
    if priority:
        stmt = stmt.where(FarmTask.priority == priority)

    result = await db.execute(
        stmt.order_by(FarmTask.due_at.asc().nulls_last(), FarmTask.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_task(db: AsyncSession, farm_id: UUID, task_id: UUID) -> Optional[FarmTask]:
    result = await db.execute(
        select(FarmTask).where(FarmTask.id == task_id, FarmTask.farm_id == farm_id)
    )
    return result.scalar_one_or_none()


async def create_task(db: AsyncSession, farm_id: UUID, assigned_by: UUID, data: TaskCreate) -> FarmTask:
    task = FarmTask(farm_id=farm_id, assigned_by_user_id=assigned_by, **data.model_dump())
    db.add(task)
    await db.flush()
    await db.refresh(task)
    return task


async def update_task(db: AsyncSession, task: FarmTask, data: TaskUpdate) -> FarmTask:
    updates = data.model_dump(exclude_none=True)
    if updates.get("status") == "completed" and not task.completed_at:
        updates["completed_at"] = datetime.now(timezone.utc)

    for field, value in updates.items():
        setattr(task, field, value)

    await db.flush()
    await db.refresh(task)
    return task


async def delete_task(db: AsyncSession, task: FarmTask) -> None:
    await db.delete(task)


async def list_treatments(
    db: AsyncSession,
    farm_id: UUID,
    animal_id: Optional[UUID] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[FarmTreatment]:
    stmt = select(FarmTreatment).where(FarmTreatment.farm_id == farm_id)
    if animal_id:
        stmt = stmt.where(FarmTreatment.animal_id == animal_id)
    if status:
        stmt = stmt.where(FarmTreatment.status == status)

    result = await db.execute(
        stmt.order_by(FarmTreatment.start_date.desc()).offset(skip).limit(limit)
    )
    return list(result.scalars().all())


async def get_treatment(db: AsyncSession, farm_id: UUID, treatment_id: UUID) -> Optional[FarmTreatment]:
    result = await db.execute(
        select(FarmTreatment).where(
            FarmTreatment.id == treatment_id,
            FarmTreatment.farm_id == farm_id,
        )
    )
    return result.scalar_one_or_none()


async def create_treatment(db: AsyncSession, farm_id: UUID, user_id: UUID, data: TreatmentCreate) -> FarmTreatment:
    treatment = FarmTreatment(
        farm_id=farm_id,
        prescribed_by_user_id=user_id,
        **data.model_dump(),
    )
    db.add(treatment)

    if data.animal_id:
        await db.execute(
            update(Animal)
            .where(Animal.id == data.animal_id, Animal.farm_id == farm_id)
            .values(health_status="under_treatment")
        )

    await db.flush()
    await db.refresh(treatment)
    return treatment


async def update_treatment(db: AsyncSession, treatment: FarmTreatment, data: TreatmentUpdate) -> FarmTreatment:
    updates = data.model_dump(exclude_none=True)
    for field, value in updates.items():
        setattr(treatment, field, value)

    if updates.get("status") == "completed" and treatment.animal_id:
        await db.execute(
            update(Animal)
            .where(Animal.id == treatment.animal_id, Animal.farm_id == treatment.farm_id)
            .values(health_status="healthy")
        )

    await db.flush()
    await db.refresh(treatment)
    return treatment


async def list_withdrawals(
    db: AsyncSession,
    farm_id: UUID,
    animal_id: Optional[UUID] = None,
    violation_only: bool = False,
    skip: int = 0,
    limit: int = 100,
) -> List[WithdrawalRecord]:
    stmt = select(WithdrawalRecord).where(WithdrawalRecord.farm_id == farm_id)
    if animal_id:
        stmt = stmt.where(WithdrawalRecord.animal_id == animal_id)
    if violation_only:
        stmt = stmt.where(WithdrawalRecord.violation_flag.is_(True))

    result = await db.execute(
        stmt.order_by(WithdrawalRecord.administered_at.desc()).offset(skip).limit(limit)
    )
    return list(result.scalars().all())


async def get_withdrawal(db: AsyncSession, farm_id: UUID, withdrawal_id: UUID) -> Optional[WithdrawalRecord]:
    result = await db.execute(
        select(WithdrawalRecord).where(
            WithdrawalRecord.id == withdrawal_id,
            WithdrawalRecord.farm_id == farm_id,
        )
    )
    return result.scalar_one_or_none()


async def create_withdrawal(db: AsyncSession, farm_id: UUID, data: WithdrawalCreate) -> WithdrawalRecord:
    safe_after = data.administered_at + timedelta(days=data.withdrawal_days)
    record = WithdrawalRecord(farm_id=farm_id, safe_after_at=safe_after, **data.model_dump())
    db.add(record)
    await db.flush()
    await db.refresh(record)
    return record


async def log_collection_attempt(
    db: AsyncSession, record: WithdrawalRecord, data: CollectionAttempt
) -> WithdrawalRecord:
    record.collection_attempted_at = data.collection_attempted_at
    record.collection_result = data.collection_result
    record.notes = data.notes or record.notes

    if record.safe_after_at and data.collection_attempted_at < record.safe_after_at:
        if data.collection_result != "skipped":
            record.violation_flag = True
            db.add(
                FarmAlert(
                    farm_id=record.farm_id,
                    type="withdrawal_violation",
                    severity="critical",
                    title="Withdrawal violation detected",
                    message=f"Collection of {record.medicine_name} attempted before safe date.",
                    metadata_json={
                        "withdrawal_id": str(record.id),
                        "medicine": record.medicine_name,
                        "safe_after": record.safe_after_at.isoformat(),
                        "attempted_at": data.collection_attempted_at.isoformat(),
                    },
                )
            )

    await db.flush()
    await db.refresh(record)
    return record


async def list_alerts(
    db: AsyncSession,
    farm_id: UUID,
    unread_only: bool = False,
    severity: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> List[FarmAlert]:
    stmt = select(FarmAlert).where(FarmAlert.farm_id == farm_id)
    if unread_only:
        stmt = stmt.where(FarmAlert.is_read.is_(False))
    if severity:
        stmt = stmt.where(FarmAlert.severity == severity)

    result = await db.execute(
        stmt.order_by(FarmAlert.created_at.desc()).offset(skip).limit(limit)
    )
    return list(result.scalars().all())


async def mark_alerts_read(db: AsyncSession, farm_id: UUID, alert_ids: List[UUID]) -> int:
    result = await db.execute(
        update(FarmAlert)
        .where(FarmAlert.farm_id == farm_id, FarmAlert.id.in_(alert_ids))
        .values(is_read=True)
    )
    return result.rowcount or 0


async def mark_all_alerts_read(db: AsyncSession, farm_id: UUID) -> int:
    result = await db.execute(
        update(FarmAlert)
        .where(FarmAlert.farm_id == farm_id, FarmAlert.is_read.is_(False))
        .values(is_read=True)
    )
    return result.rowcount or 0


async def get_dashboard_summary(db: AsyncSession, owner_user_id: UUID) -> FarmDashboardSummary:
    farm = await get_farm_by_owner(db, owner_user_id)
    if not farm:
        return FarmDashboardSummary(
            farm=None,
            total_animals=0,
            healthy_animals=0,
            sick_animals=0,
            pending_tasks=0,
            overdue_tasks=0,
            active_treatments=0,
            pending_withdrawals=0,
            violation_count=0,
            unread_alerts=0,
        )

    fid = farm.id
    now = datetime.now(timezone.utc)

    total_animals = (
        await db.scalar(select(func.count(Animal.id)).where(Animal.farm_id == fid))
    ) or 0
    healthy_animals = (
        await db.scalar(
            select(func.count(Animal.id)).where(
                Animal.farm_id == fid,
                Animal.health_status == "healthy",
            )
        )
    ) or 0
    sick_animals = (
        await db.scalar(
            select(func.count(Animal.id)).where(
                Animal.farm_id == fid,
                Animal.health_status.in_(["sick", "under_treatment", "quarantined"]),
            )
        )
    ) or 0

    pending_tasks = (
        await db.scalar(
            select(func.count(FarmTask.id)).where(
                FarmTask.farm_id == fid,
                FarmTask.status.in_(["pending", "in_progress"]),
            )
        )
    ) or 0
    overdue_tasks = (
        await db.scalar(
            select(func.count(FarmTask.id)).where(
                FarmTask.farm_id == fid,
                FarmTask.status.in_(["pending", "in_progress"]),
                FarmTask.due_at < now,
            )
        )
    ) or 0

    active_treatments = (
        await db.scalar(
            select(func.count(FarmTreatment.id)).where(
                FarmTreatment.farm_id == fid,
                FarmTreatment.status == "active",
            )
        )
    ) or 0

    pending_withdrawals = (
        await db.scalar(
            select(func.count(WithdrawalRecord.id)).where(
                WithdrawalRecord.farm_id == fid,
                WithdrawalRecord.safe_after_at > now,
                WithdrawalRecord.collection_result.is_(None),
            )
        )
    ) or 0

    violation_count = (
        await db.scalar(
            select(func.count(WithdrawalRecord.id)).where(
                WithdrawalRecord.farm_id == fid,
                WithdrawalRecord.violation_flag.is_(True),
            )
        )
    ) or 0

    unread_alerts = (
        await db.scalar(
            select(func.count(FarmAlert.id)).where(
                FarmAlert.farm_id == fid,
                FarmAlert.is_read.is_(False),
            )
        )
    ) or 0

    return FarmDashboardSummary(
        farm=farm,
        total_animals=total_animals,
        healthy_animals=healthy_animals,
        sick_animals=sick_animals,
        pending_tasks=pending_tasks,
        overdue_tasks=overdue_tasks,
        active_treatments=active_treatments,
        pending_withdrawals=pending_withdrawals,
        violation_count=violation_count,
        unread_alerts=unread_alerts,
    )


async def list_assigned_vets_for_farm(db: AsyncSession, farm_id: UUID) -> List[VetOptionOut]:
    result = await db.execute(
        select(
            User.id.label("vet_user_id"),
            User.full_name.label("vet_name"),
            User.email,
            User.phone_number,
        )
        .join(VetFarmAssignment, VetFarmAssignment.vet_user_id == User.id)
        .where(
            VetFarmAssignment.farm_id == farm_id,
            VetFarmAssignment.active.is_(True),
            User.is_active.is_(True),
        )
        .order_by(User.full_name.asc())
    )
    rows = result.all()
    if not rows:
        fallback_result = await db.execute(
            select(
                User.id.label("vet_user_id"),
                User.full_name.label("vet_name"),
                User.email,
                User.phone_number,
                User.role,
                User.is_active,
            )
            .where(
                User.email == PRIMARY_VET_EMAIL,
            )
            .order_by(User.full_name.asc())
        )
        fallback_rows = fallback_result.all()
        rows = [
            row
            for row in fallback_rows
            if str(row.role).lower() == "veterinarian" and bool(row.is_active)
        ]

    return [
        VetOptionOut(
            vet_user_id=row.vet_user_id,
            vet_name=row.vet_name,
            email=row.email,
            phone_number=row.phone_number,
        )
        for row in rows
    ]


async def create_appointment_request(
    db: AsyncSession,
    farm_id: UUID,
    farmer_user_id: UUID,
    data: AppointmentRequestCreate,
) -> AppointmentRequestOut:
    assignment = await db.execute(
        select(VetFarmAssignment).where(
            VetFarmAssignment.farm_id == farm_id,
            VetFarmAssignment.vet_user_id == data.vet_user_id,
            VetFarmAssignment.active.is_(True),
        )
    )
    active_assignment = assignment.scalar_one_or_none()
    if not active_assignment:
        vet_result = await db.execute(
            select(User).where(
                User.id == data.vet_user_id,
            )
        )
        vet_user = vet_result.scalar_one_or_none()
        if not vet_user or str(vet_user.role).lower() != "veterinarian" or not vet_user.is_active:
            raise ValueError("Selected veterinarian is unavailable.")

        auto_assignment = VetFarmAssignment(
            vet_user_id=data.vet_user_id,
            farm_id=farm_id,
            active=True,
            notes="Auto-assigned via farmer appointment request",
        )
        db.add(auto_assignment)
        await db.flush()

    appt = VetAppointment(
        vet_user_id=data.vet_user_id,
        farm_id=farm_id,
        farmer_user_id=farmer_user_id,
        appointment_type=data.appointment_type,
        scheduled_at=data.preferred_datetime,
        duration_minutes=data.duration_minutes,
        status="requested",
        reason=data.reason_notes,
        notes="Requested by farmer",
    )
    db.add(appt)
    await db.flush()
    await db.refresh(appt)

    db.add(
        VetAlert(
            vet_user_id=data.vet_user_id,
            farm_id=farm_id,
            type="appointment_request",
            severity="medium",
            title="New appointment request",
            message=f"Farmer requested a {data.appointment_type} appointment.",
            metadata_json={"appointment_id": str(appt.id), "source": "farm_owner"},
        )
    )

    vet_user = await db.execute(select(User).where(User.id == data.vet_user_id))
    vet = vet_user.scalar_one_or_none()

    return AppointmentRequestOut(
        id=appt.id,
        vet_user_id=appt.vet_user_id,
        vet_name=vet.full_name if vet else None,
        farm_id=appt.farm_id,
        appointment_type=appt.appointment_type,
        scheduled_at=appt.scheduled_at,
        status=appt.status,
        reason=appt.reason,
        notes=appt.notes,
        created_at=appt.created_at,
        updated_at=appt.updated_at,
    )


async def list_farmer_appointment_requests(
    db: AsyncSession,
    farm_id: UUID,
    farmer_user_id: UUID,
    status_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[AppointmentRequestOut]:
    stmt = (
        select(
            VetAppointment,
            User.full_name.label("vet_name"),
        )
        .join(User, User.id == VetAppointment.vet_user_id)
        .where(
            VetAppointment.farm_id == farm_id,
            VetAppointment.farmer_user_id == farmer_user_id,
        )
    )

    if status_filter:
        stmt = stmt.where(VetAppointment.status == status_filter)

    result = await db.execute(stmt.order_by(VetAppointment.created_at.desc()).offset(skip).limit(limit))
    rows = result.all()
    return [
        AppointmentRequestOut(
            id=row.VetAppointment.id,
            vet_user_id=row.VetAppointment.vet_user_id,
            vet_name=row.vet_name,
            farm_id=row.VetAppointment.farm_id,
            appointment_type=row.VetAppointment.appointment_type,
            scheduled_at=row.VetAppointment.scheduled_at,
            status=row.VetAppointment.status,
            reason=row.VetAppointment.reason,
            notes=row.VetAppointment.notes,
            created_at=row.VetAppointment.created_at,
            updated_at=row.VetAppointment.updated_at,
        )
        for row in rows
    ]
