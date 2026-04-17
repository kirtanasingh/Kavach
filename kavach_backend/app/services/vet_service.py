from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from sqlalchemy import distinct, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auth import User
from app.models.vet import AMULog, Prescription, VetAlert, VetAppointment, VetFarmAssignment, VetMessage
from app.schemas.vet import (
    AMULogCreate,
    AMULogUpdate,
    AMUSummaryByDrug,
    AMUSummaryBySpecies,
    AppointmentCreate,
    AppointmentUpdate,
    AssignmentCreate,
    FarmerDirectoryOut,
    FarmSummaryForVet,
    MessageSend,
    PrescriptionCreate,
    PrescriptionUpdate,
    VetDashboardSummary,
)


async def get_assigned_farms(db: AsyncSession, vet_user_id: UUID) -> List[VetFarmAssignment]:
    result = await db.execute(
        select(VetFarmAssignment)
        .where(VetFarmAssignment.vet_user_id == vet_user_id, VetFarmAssignment.active.is_(True))
        .order_by(VetFarmAssignment.assigned_at.desc())
    )
    return result.scalars().all()


async def get_farms_with_details(db: AsyncSession, vet_user_id: UUID) -> List[FarmSummaryForVet]:
    from app.models.farm_owner import Farm

    result = await db.execute(
        select(
            VetFarmAssignment.farm_id,
            VetFarmAssignment.active,
            VetFarmAssignment.assigned_at,
            Farm.farm_name,
            Farm.city,
            Farm.state,
            Farm.owner_user_id,
            User.full_name.label("owner_name"),
        )
        .join(Farm, Farm.id == VetFarmAssignment.farm_id)
        .join(User, User.id == Farm.owner_user_id)
        .where(VetFarmAssignment.vet_user_id == vet_user_id, VetFarmAssignment.active.is_(True))
        .order_by(Farm.farm_name)
    )
    rows = result.all()
    return [
        FarmSummaryForVet(
            farm_id=r.farm_id,
            farm_name=r.farm_name,
            owner_name=r.owner_name,
            owner_user_id=r.owner_user_id,
            city=r.city,
            state=r.state,
            active=r.active,
            assigned_at=r.assigned_at,
        )
        for r in rows
    ]


async def list_farmer_directory(db: AsyncSession) -> List[FarmerDirectoryOut]:
    from app.models.farm_owner import Farm, FarmRiskProfile

    result = await db.execute(
        select(
            User.id.label("farmer_user_id"),
            User.full_name.label("farmer_name"),
            User.email,
            User.phone_number,
            Farm.id.label("farm_id"),
            Farm.farm_name,
            FarmRiskProfile.risk_score,
            FarmRiskProfile.risk_level,
            FarmRiskProfile.top_risk_factors,
            FarmRiskProfile.dashboard_flags,
        )
        .outerjoin(Farm, Farm.owner_user_id == User.id)
        .outerjoin(FarmRiskProfile, FarmRiskProfile.farm_id == Farm.id)
        .where(User.role == "farm_owner", User.is_active.is_(True))
        .order_by(User.full_name.asc())
    )

    rows = result.all()
    payload: List[FarmerDirectoryOut] = []
    for row in rows:
        flags: List[str] = []
        if isinstance(row.top_risk_factors, list):
            flags.extend([str(item) for item in row.top_risk_factors[:3]])
        if isinstance(row.dashboard_flags, dict):
            for key, value in row.dashboard_flags.items():
                if value:
                    flags.append(str(key).replace("_", " "))

        deduped_flags = list(dict.fromkeys(flags))[:4]

        payload.append(
            FarmerDirectoryOut(
                farmer_user_id=row.farmer_user_id,
                farmer_name=row.farmer_name,
                farm_id=row.farm_id,
                farm_name=row.farm_name,
                email=row.email,
                phone_number=row.phone_number,
                risk_score=row.risk_score,
                risk_level=row.risk_level,
                key_flags=deduped_flags,
            )
        )
    return payload


async def assign_farm(db: AsyncSession, vet_user_id: UUID, data: AssignmentCreate) -> VetFarmAssignment:
    result = await db.execute(
        select(VetFarmAssignment).where(
            VetFarmAssignment.vet_user_id == vet_user_id,
            VetFarmAssignment.farm_id == data.farm_id,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.active = True
        existing.unassigned_at = None
        existing.notes = data.notes or existing.notes
        await db.commit()
        await db.refresh(existing)
        return existing

    assignment = VetFarmAssignment(vet_user_id=vet_user_id, farm_id=data.farm_id, notes=data.notes)
    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)
    return assignment


async def unassign_farm(db: AsyncSession, vet_user_id: UUID, farm_id: UUID) -> bool:
    result = await db.execute(
        select(VetFarmAssignment).where(
            VetFarmAssignment.vet_user_id == vet_user_id,
            VetFarmAssignment.farm_id == farm_id,
            VetFarmAssignment.active.is_(True),
        )
    )
    assignment = result.scalar_one_or_none()
    if not assignment:
        return False

    assignment.active = False
    assignment.unassigned_at = datetime.now(timezone.utc)
    await db.commit()
    return True


async def list_appointments(
    db: AsyncSession,
    vet_user_id: UUID,
    status: Optional[str] = None,
    farm_id: Optional[UUID] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 50,
) -> List[VetAppointment]:
    q = select(VetAppointment).where(VetAppointment.vet_user_id == vet_user_id)
    if status:
        q = q.where(VetAppointment.status == status)
    if farm_id:
        q = q.where(VetAppointment.farm_id == farm_id)
    if from_date:
        q = q.where(VetAppointment.scheduled_at >= from_date)
    if to_date:
        q = q.where(VetAppointment.scheduled_at <= to_date)
    q = q.order_by(VetAppointment.scheduled_at.asc()).offset(skip).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


async def get_appointment(db: AsyncSession, vet_user_id: UUID, appt_id: UUID) -> Optional[VetAppointment]:
    result = await db.execute(
        select(VetAppointment).where(VetAppointment.id == appt_id, VetAppointment.vet_user_id == vet_user_id)
    )
    return result.scalar_one_or_none()


async def create_appointment(db: AsyncSession, vet_user_id: UUID, data: AppointmentCreate) -> VetAppointment:
    appt = VetAppointment(vet_user_id=vet_user_id, **data.model_dump())
    db.add(appt)
    await db.commit()
    await db.refresh(appt)
    return appt


async def update_appointment(db: AsyncSession, appt: VetAppointment, data: AppointmentUpdate) -> VetAppointment:
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(appt, field, value)
    await db.commit()
    await db.refresh(appt)
    return appt


async def cancel_appointment(db: AsyncSession, appt: VetAppointment, reason: Optional[str] = None) -> VetAppointment:
    appt.status = "cancelled"
    appt.cancellation_reason = reason
    await db.commit()
    await db.refresh(appt)
    return appt


async def list_prescriptions(
    db: AsyncSession,
    vet_user_id: UUID,
    farm_id: Optional[UUID] = None,
    animal_id: Optional[UUID] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[Prescription]:
    q = select(Prescription).where(Prescription.vet_user_id == vet_user_id)
    if farm_id:
        q = q.where(Prescription.farm_id == farm_id)
    if animal_id:
        q = q.where(Prescription.animal_id == animal_id)
    if status:
        q = q.where(Prescription.status == status)
    q = q.order_by(Prescription.prescribed_on.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


async def get_prescription(db: AsyncSession, vet_user_id: UUID, rx_id: UUID) -> Optional[Prescription]:
    result = await db.execute(
        select(Prescription).where(Prescription.id == rx_id, Prescription.vet_user_id == vet_user_id)
    )
    return result.scalar_one_or_none()


async def create_prescription(db: AsyncSession, vet_user_id: UUID, data: PrescriptionCreate) -> Prescription:
    rx = Prescription(vet_user_id=vet_user_id, **data.model_dump())
    db.add(rx)
    await db.commit()
    await db.refresh(rx)
    return rx


async def update_prescription(db: AsyncSession, rx: Prescription, data: PrescriptionUpdate) -> Prescription:
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(rx, field, value)
    await db.commit()
    await db.refresh(rx)
    return rx


async def dispense_prescription(db: AsyncSession, rx: Prescription) -> Prescription:
    if rx.refills_used < rx.refills_allowed:
        rx.refills_used += 1
    else:
        rx.status = "dispensed"
    await db.commit()
    await db.refresh(rx)
    return rx


async def list_amu_logs(
    db: AsyncSession,
    vet_user_id: UUID,
    farm_id: Optional[UUID] = None,
    species: Optional[str] = None,
    drug_class: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[AMULog]:
    q = select(AMULog).where(AMULog.entered_by_user_id == vet_user_id)
    if farm_id:
        q = q.where(AMULog.farm_id == farm_id)
    if species:
        q = q.where(AMULog.species == species)
    if drug_class:
        q = q.where(AMULog.drug_class == drug_class)
    if from_date:
        q = q.where(AMULog.administration_date >= from_date)
    if to_date:
        q = q.where(AMULog.administration_date <= to_date)
    q = q.order_by(AMULog.administration_date.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


async def get_amu_log(db: AsyncSession, vet_user_id: UUID, log_id: UUID) -> Optional[AMULog]:
    result = await db.execute(
        select(AMULog).where(AMULog.id == log_id, AMULog.entered_by_user_id == vet_user_id)
    )
    return result.scalar_one_or_none()


async def create_amu_log(db: AsyncSession, vet_user_id: UUID, data: AMULogCreate) -> AMULog:
    payload = data.model_dump()
    admin_date = payload["administration_date"]
    withdrawal = payload.get("withdrawal_period_days", 0)
    payload["safe_after_date"] = admin_date + timedelta(days=withdrawal or 0)

    log = AMULog(entered_by_user_id=vet_user_id, **payload)
    db.add(log)
    await db.commit()
    await db.refresh(log)

    await _check_amr_risk(db, vet_user_id, data.farm_id)
    return log


async def update_amu_log(db: AsyncSession, log: AMULog, data: AMULogUpdate) -> AMULog:
    updates = data.model_dump(exclude_none=True)
    if "withdrawal_period_days" in updates and log.administration_date:
        updates["safe_after_date"] = log.administration_date + timedelta(days=updates["withdrawal_period_days"])
    for field, value in updates.items():
        setattr(log, field, value)
    await db.commit()
    await db.refresh(log)
    return log


async def get_amu_summary_by_drug(
    db: AsyncSession,
    vet_user_id: UUID,
    farm_id: Optional[UUID] = None,
    days: int = 30,
) -> List[AMUSummaryByDrug]:
    cutoff = date.today() - timedelta(days=days)
    q = (
        select(
            AMULog.drug_name,
            AMULog.drug_class,
            func.count(AMULog.id).label("total_entries"),
            func.sum(AMULog.dosage).label("total_dosage"),
            func.count(distinct(AMULog.farm_id)).label("farms_affected"),
        )
        .where(AMULog.entered_by_user_id == vet_user_id, AMULog.administration_date >= cutoff)
    )
    if farm_id:
        q = q.where(AMULog.farm_id == farm_id)

    q = q.group_by(AMULog.drug_name, AMULog.drug_class).order_by(func.count(AMULog.id).desc())
    result = await db.execute(q)
    return [
        AMUSummaryByDrug(
            drug_name=row.drug_name,
            drug_class=row.drug_class,
            total_entries=row.total_entries,
            total_dosage=row.total_dosage or Decimal(0),
            farms_affected=row.farms_affected,
        )
        for row in result.all()
    ]


async def get_amu_summary_by_species(
    db: AsyncSession,
    vet_user_id: UUID,
    farm_id: Optional[UUID] = None,
    days: int = 30,
) -> List[AMUSummaryBySpecies]:
    cutoff = date.today() - timedelta(days=days)
    q = (
        select(
            AMULog.species,
            func.count(AMULog.id).label("total_entries"),
            func.count(distinct(AMULog.drug_name)).label("drug_count"),
        )
        .where(AMULog.entered_by_user_id == vet_user_id, AMULog.administration_date >= cutoff)
    )
    if farm_id:
        q = q.where(AMULog.farm_id == farm_id)

    q = q.group_by(AMULog.species).order_by(func.count(AMULog.id).desc())
    result = await db.execute(q)
    return [
        AMUSummaryBySpecies(species=row.species, total_entries=row.total_entries, drug_count=row.drug_count)
        for row in result.all()
    ]


async def _check_amr_risk(db: AsyncSession, vet_user_id: UUID, farm_id: UUID) -> None:
    cutoff = date.today() - timedelta(days=30)
    result = await db.execute(
        select(func.count(distinct(AMULog.drug_class))).where(
            AMULog.farm_id == farm_id,
            AMULog.drug_class.is_not(None),
            AMULog.administration_date >= cutoff,
        )
    )
    drug_class_count = result.scalar() or 0

    if drug_class_count > 3:
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
        existing = await db.execute(
            select(VetAlert).where(
                VetAlert.vet_user_id == vet_user_id,
                VetAlert.farm_id == farm_id,
                VetAlert.type == "amr_risk",
                VetAlert.created_at >= seven_days_ago,
            )
        )
        if not existing.scalar_one_or_none():
            alert = VetAlert(
                vet_user_id=vet_user_id,
                farm_id=farm_id,
                type="amr_risk",
                severity="high",
                title="AMR risk threshold exceeded",
                message=f"Farm used {drug_class_count} distinct antibiotic classes in the last 30 days.",
                metadata_json={"drug_class_count": drug_class_count, "days_window": 30},
            )
            db.add(alert)
            await db.commit()


async def list_messages(
    db: AsyncSession,
    vet_user_id: UUID,
    farm_id: Optional[UUID] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[VetMessage]:
    q = select(VetMessage).where(VetMessage.vet_user_id == vet_user_id)
    if farm_id:
        q = q.where(VetMessage.farm_id == farm_id)
    q = q.order_by(VetMessage.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


async def send_message(db: AsyncSession, vet_user_id: UUID, data: MessageSend) -> VetMessage:
    msg = VetMessage(
        farm_id=data.farm_id,
        vet_user_id=vet_user_id,
        farmer_user_id=data.farmer_user_id,
        sender_user_id=vet_user_id,
        sender_role="veterinarian",
        message_text=data.message_text,
        attachment_url=data.attachment_url,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg


async def mark_messages_read(db: AsyncSession, vet_user_id: UUID, farm_id: UUID) -> int:
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(VetMessage).where(
            VetMessage.vet_user_id == vet_user_id,
            VetMessage.farm_id == farm_id,
            VetMessage.is_read.is_(False),
            VetMessage.sender_role == "farm_owner",
        )
    )
    rows = result.scalars().all()
    for row in rows:
        row.is_read = True
        row.read_at = now
    await db.commit()
    return len(rows)


async def list_alerts(
    db: AsyncSession,
    vet_user_id: UUID,
    unread_only: bool = False,
    severity: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> List[VetAlert]:
    q = select(VetAlert).where(VetAlert.vet_user_id == vet_user_id)
    if unread_only:
        q = q.where(VetAlert.is_read.is_(False))
    if severity:
        q = q.where(VetAlert.severity == severity)
    q = q.order_by(VetAlert.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


async def mark_alerts_read(db: AsyncSession, vet_user_id: UUID, alert_ids: List[UUID]) -> int:
    result = await db.execute(select(VetAlert).where(VetAlert.vet_user_id == vet_user_id, VetAlert.id.in_(alert_ids)))
    rows = result.scalars().all()
    for row in rows:
        row.is_read = True
    await db.commit()
    return len(rows)


async def mark_all_alerts_read(db: AsyncSession, vet_user_id: UUID) -> int:
    result = await db.execute(select(VetAlert).where(VetAlert.vet_user_id == vet_user_id, VetAlert.is_read.is_(False)))
    rows = result.scalars().all()
    for row in rows:
        row.is_read = True
    await db.commit()
    return len(rows)


async def get_dashboard_summary(db: AsyncSession, vet_user_id: UUID) -> VetDashboardSummary:
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
    next_7_days = now + timedelta(days=7)
    month_start = date.today().replace(day=1)

    async def scalar(q):
        result = await db.execute(q)
        return result.scalar() or 0

    assigned_farms = await scalar(
        select(func.count(VetFarmAssignment.id)).where(
            VetFarmAssignment.vet_user_id == vet_user_id,
            VetFarmAssignment.active.is_(True),
        )
    )
    todays_appointments = await scalar(
        select(func.count(VetAppointment.id)).where(
            VetAppointment.vet_user_id == vet_user_id,
            VetAppointment.scheduled_at >= today_start,
            VetAppointment.scheduled_at <= today_end,
            VetAppointment.status.in_(["scheduled", "confirmed"]),
        )
    )
    upcoming_appointments = await scalar(
        select(func.count(VetAppointment.id)).where(
            VetAppointment.vet_user_id == vet_user_id,
            VetAppointment.scheduled_at > now,
            VetAppointment.scheduled_at <= next_7_days,
            VetAppointment.status.in_(["scheduled", "confirmed"]),
        )
    )
    active_prescriptions = await scalar(
        select(func.count(Prescription.id)).where(
            Prescription.vet_user_id == vet_user_id,
            Prescription.status == "active",
        )
    )
    amu_this_month = await scalar(
        select(func.count(AMULog.id)).where(
            AMULog.entered_by_user_id == vet_user_id,
            AMULog.administration_date >= month_start,
        )
    )
    unread_messages = await scalar(
        select(func.count(VetMessage.id)).where(
            VetMessage.vet_user_id == vet_user_id,
            VetMessage.is_read.is_(False),
            VetMessage.sender_role == "farm_owner",
        )
    )
    unread_alerts = await scalar(
        select(func.count(VetAlert.id)).where(
            VetAlert.vet_user_id == vet_user_id,
            VetAlert.is_read.is_(False),
        )
    )
    amr_risk_farms = await scalar(
        select(func.count(VetAlert.id)).where(
            VetAlert.vet_user_id == vet_user_id,
            VetAlert.type == "amr_risk",
            VetAlert.is_read.is_(False),
        )
    )

    pending_reviews = 0
    try:
        pending_result = await db.execute(
            text("SELECT COUNT(*) FROM detection_records WHERE status = :status"),
            {"status": "pending_review"},
        )
        pending_reviews = pending_result.scalar() or 0
    except Exception:
        pending_reviews = 0

    return VetDashboardSummary(
        assigned_farms=assigned_farms,
        todays_appointments=todays_appointments,
        upcoming_appointments=upcoming_appointments,
        pending_reviews=pending_reviews,
        active_prescriptions=active_prescriptions,
        amu_entries_this_month=amu_this_month,
        unread_messages=unread_messages,
        unread_alerts=unread_alerts,
        amr_risk_farms=amr_risk_farms,
    )
