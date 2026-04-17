from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import CurrentUser, VetOnly
from app.schemas.vet import (
    AMULogCreate,
    AMULogOut,
    AMULogUpdate,
    AMUSummaryByDrug,
    AMUSummaryBySpecies,
    AlertMarkRead,
    AppointmentCreate,
    AppointmentOut,
    AppointmentUpdate,
    AssignmentCreate,
    AssignmentOut,
    FarmerDirectoryOut,
    FarmSummaryForVet,
    MessageOut,
    MessageSend,
    PrescriptionCreate,
    PrescriptionOut,
    PrescriptionUpdate,
    VetAlertOut,
    VetDashboardSummary,
)
from app.services import vet_service as svc

router = APIRouter(prefix="/vet", tags=["Veterinarian"], dependencies=[VetOnly])


@router.get("/summary", response_model=VetDashboardSummary)
async def get_dashboard_summary(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    return await svc.get_dashboard_summary(db, current_user.id)


@router.get("/farms", response_model=List[FarmSummaryForVet])
async def get_my_farms(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    return await svc.get_farms_with_details(db, current_user.id)


@router.get("/farmers/directory", response_model=List[FarmerDirectoryOut])
async def get_farmers_directory(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    _ = current_user
    return await svc.list_farmer_directory(db)


@router.post("/farms/assign", response_model=AssignmentOut, status_code=status.HTTP_201_CREATED)
async def assign_farm(data: AssignmentCreate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    return await svc.assign_farm(db, current_user.id, data)


@router.delete("/farms/{farm_id}/unassign", status_code=status.HTTP_204_NO_CONTENT)
async def unassign_farm(farm_id: UUID, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    ok = await svc.unassign_farm(db, current_user.id, farm_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Assignment not found or already inactive.")


@router.get("/appointments", response_model=List[AppointmentOut])
async def list_appointments(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    status_filter: Optional[str] = Query(None, alias="status"),
    farm_id: Optional[UUID] = Query(None),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
):
    return await svc.list_appointments(
        db,
        current_user.id,
        status=status_filter,
        farm_id=farm_id,
        from_date=from_date,
        to_date=to_date,
        skip=skip,
        limit=limit,
    )


@router.post("/appointments", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
async def create_appointment(data: AppointmentCreate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    return await svc.create_appointment(db, current_user.id, data)


@router.get("/appointments/{appt_id}", response_model=AppointmentOut)
async def get_appointment(appt_id: UUID, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    appt = await svc.get_appointment(db, current_user.id, appt_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")
    return appt


@router.patch("/appointments/{appt_id}", response_model=AppointmentOut)
async def update_appointment(
    appt_id: UUID,
    data: AppointmentUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    appt = await svc.get_appointment(db, current_user.id, appt_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")
    return await svc.update_appointment(db, appt, data)


@router.post("/appointments/{appt_id}/cancel", response_model=AppointmentOut)
async def cancel_appointment(
    appt_id: UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    reason: Optional[str] = Query(None),
):
    appt = await svc.get_appointment(db, current_user.id, appt_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")
    if appt.status in ("completed", "cancelled"):
        raise HTTPException(status_code=409, detail=f"Cannot cancel a {appt.status} appointment.")
    return await svc.cancel_appointment(db, appt, reason)


@router.get("/prescriptions", response_model=List[PrescriptionOut])
async def list_prescriptions(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    farm_id: Optional[UUID] = Query(None),
    animal_id: Optional[UUID] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=500),
):
    return await svc.list_prescriptions(
        db,
        current_user.id,
        farm_id=farm_id,
        animal_id=animal_id,
        status=status_filter,
        skip=skip,
        limit=limit,
    )


@router.post("/prescriptions", response_model=PrescriptionOut, status_code=status.HTTP_201_CREATED)
async def create_prescription(data: PrescriptionCreate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    return await svc.create_prescription(db, current_user.id, data)


@router.get("/prescriptions/{rx_id}", response_model=PrescriptionOut)
async def get_prescription(rx_id: UUID, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    rx = await svc.get_prescription(db, current_user.id, rx_id)
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found.")
    return rx


@router.patch("/prescriptions/{rx_id}", response_model=PrescriptionOut)
async def update_prescription(
    rx_id: UUID,
    data: PrescriptionUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    rx = await svc.get_prescription(db, current_user.id, rx_id)
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found.")
    return await svc.update_prescription(db, rx, data)


@router.post("/prescriptions/{rx_id}/dispense", response_model=PrescriptionOut)
async def dispense_prescription(rx_id: UUID, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    rx = await svc.get_prescription(db, current_user.id, rx_id)
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found.")
    if rx.status in ("completed", "cancelled"):
        raise HTTPException(status_code=409, detail=f"Prescription is {rx.status}.")
    return await svc.dispense_prescription(db, rx)


@router.get("/amu-logs", response_model=List[AMULogOut])
async def list_amu_logs(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    farm_id: Optional[UUID] = Query(None),
    species: Optional[str] = Query(None),
    drug_class: Optional[str] = Query(None),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=500),
):
    return await svc.list_amu_logs(
        db,
        current_user.id,
        farm_id=farm_id,
        species=species,
        drug_class=drug_class,
        from_date=from_date,
        to_date=to_date,
        skip=skip,
        limit=limit,
    )


@router.post("/amu-logs", response_model=AMULogOut, status_code=status.HTTP_201_CREATED)
async def create_amu_log(data: AMULogCreate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    return await svc.create_amu_log(db, current_user.id, data)


@router.get("/amu-logs/summary/by-drug", response_model=List[AMUSummaryByDrug])
async def amu_summary_by_drug(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    farm_id: Optional[UUID] = Query(None),
    days: int = Query(30, ge=7, le=365),
):
    return await svc.get_amu_summary_by_drug(db, current_user.id, farm_id=farm_id, days=days)


@router.get("/amu-logs/summary/by-species", response_model=List[AMUSummaryBySpecies])
async def amu_summary_by_species(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    farm_id: Optional[UUID] = Query(None),
    days: int = Query(30, ge=7, le=365),
):
    return await svc.get_amu_summary_by_species(db, current_user.id, farm_id=farm_id, days=days)


@router.get("/amu-logs/{log_id}", response_model=AMULogOut)
async def get_amu_log(log_id: UUID, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    log = await svc.get_amu_log(db, current_user.id, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="AMU log not found.")
    return log


@router.patch("/amu-logs/{log_id}", response_model=AMULogOut)
async def update_amu_log(
    log_id: UUID,
    data: AMULogUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    log = await svc.get_amu_log(db, current_user.id, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="AMU log not found.")
    return await svc.update_amu_log(db, log, data)


@router.get("/messages", response_model=List[MessageOut])
async def list_messages(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    farm_id: Optional[UUID] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=500),
):
    return await svc.list_messages(db, current_user.id, farm_id=farm_id, skip=skip, limit=limit)


@router.post("/messages", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
async def send_message(data: MessageSend, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    return await svc.send_message(db, current_user.id, data)


@router.post("/messages/mark-read/{farm_id}")
async def mark_messages_read(farm_id: UUID, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    count = await svc.mark_messages_read(db, current_user.id, farm_id)
    return {"marked_read": count}


@router.get("/alerts", response_model=List[VetAlertOut])
async def list_alerts(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    unread_only: bool = Query(False),
    severity: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
):
    return await svc.list_alerts(
        db,
        current_user.id,
        unread_only=unread_only,
        severity=severity,
        skip=skip,
        limit=limit,
    )


@router.post("/alerts/mark-read")
async def mark_alerts_read(data: AlertMarkRead, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    count = await svc.mark_alerts_read(db, current_user.id, data.alert_ids)
    return {"marked_read": count}


@router.post("/alerts/mark-all-read")
async def mark_all_alerts_read(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    count = await svc.mark_all_alerts_read(db, current_user.id)
    return {"marked_read": count}
