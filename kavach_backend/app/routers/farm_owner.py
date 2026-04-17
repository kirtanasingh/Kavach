from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.auth import User
from app.schemas.farm_owner import (
    AlertMarkRead,
    AlertOut,
    AnimalCreate,
    AnimalOut,
    AnimalUpdate,
    AppointmentRequestCreate,
    AppointmentRequestOut,
    CollectionAttempt,
    FarmCreate,
    FarmDashboardSummary,
    FarmOut,
    RiskProfileInsightsOut,
    RiskProfileOut,
    RiskProfileQnAIn,
    RiskProfileStatusOut,
    FarmUpdate,
    RiskAssessmentOut,
    RiskAssessmentSubmit,
    TaskCreate,
    TaskOut,
    TaskUpdate,
    TreatmentCreate,
    TreatmentOut,
    TreatmentUpdate,
    VetOptionOut,
    WithdrawalCreate,
    WithdrawalOut,
)
from app.services import farm_owner_service as svc

router = APIRouter(prefix="/farms", tags=["Farm Owner"])


def _farm_not_found() -> HTTPException:
    return HTTPException(status_code=404, detail="Farm not found. Create one first.")


async def _get_farm_or_404(db: AsyncSession, owner_user_id: UUID):
    farm = await svc.get_farm_by_owner(db, owner_user_id)
    if not farm:
        raise _farm_not_found()
    return farm


@router.get("/me/summary", response_model=FarmDashboardSummary)
async def get_dashboard_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await svc.get_dashboard_summary(db, current_user.id)


@router.get("/me", response_model=FarmOut)
async def get_my_farm(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await _get_farm_or_404(db, current_user.id)


@router.post("/me", response_model=FarmOut, status_code=status.HTTP_201_CREATED)
async def create_my_farm(
    data: FarmCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = await svc.get_farm_by_owner(db, current_user.id)
    if existing:
        raise HTTPException(status_code=409, detail="Farm already exists. Use PATCH to update.")
    return await svc.create_farm(db, current_user.id, data)


@router.patch("/me", response_model=FarmOut)
async def update_my_farm(
    data: FarmUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = await _get_farm_or_404(db, current_user.id)
    return await svc.update_farm(db, farm, data)


@router.get("/me/risk-assessment", response_model=List[RiskAssessmentOut])
async def get_risk_assessment(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = await _get_farm_or_404(db, current_user.id)
    return await svc.get_risk_assessment(db, farm.id)


@router.post("/me/risk-assessment", response_model=List[RiskAssessmentOut])
async def submit_risk_assessment(
    data: RiskAssessmentSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = await _get_farm_or_404(db, current_user.id)
    return await svc.submit_risk_assessment(db, farm.id, data)


@router.get("/me/risk-assessment/status", response_model=RiskProfileStatusOut)
async def get_risk_assessment_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = await _get_farm_or_404(db, current_user.id)
    return await svc.get_risk_profile_status(db, farm.id)


@router.get("/me/risk-assessment/profile", response_model=RiskProfileOut)
async def get_risk_assessment_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = await _get_farm_or_404(db, current_user.id)
    profile = await svc.get_risk_profile(db, farm.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Risk profile not found")
    return profile


@router.post("/me/risk-assessment/draft", response_model=RiskProfileOut)
async def save_risk_assessment_draft(
    data: RiskProfileQnAIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = await _get_farm_or_404(db, current_user.id)
    return await svc.save_risk_profile(db, farm.id, current_user.id, data, submit=False)


@router.post("/me/risk-assessment/submit", response_model=RiskProfileOut)
async def submit_risk_assessment_profile(
    data: RiskProfileQnAIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = await _get_farm_or_404(db, current_user.id)
    return await svc.save_risk_profile(db, farm.id, current_user.id, data, submit=True)


@router.get("/me/risk-assessment/insights", response_model=RiskProfileInsightsOut)
async def get_risk_assessment_insights(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = await _get_farm_or_404(db, current_user.id)
    insights = await svc.get_risk_profile_insights(db, farm.id)
    if not insights:
        raise HTTPException(status_code=404, detail="Risk insights not available")
    return insights


@router.get("/me/animals", response_model=List[AnimalOut])
async def list_animals(
    species: Optional[str] = Query(None),
    health_status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = await _get_farm_or_404(db, current_user.id)
    return await svc.list_animals(db, farm.id, species=species, health_status=health_status, skip=skip, limit=limit)


@router.post("/me/animals", response_model=AnimalOut, status_code=status.HTTP_201_CREATED)
async def create_animal(
    data: AnimalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = await _get_farm_or_404(db, current_user.id)
    return await svc.create_animal(db, farm.id, data)


@router.get("/me/animals/{animal_id}", response_model=AnimalOut)
async def get_animal(
    animal_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = await _get_farm_or_404(db, current_user.id)
    animal = await svc.get_animal(db, farm.id, animal_id)
    if not animal:
        raise HTTPException(status_code=404, detail="Animal not found")
    return animal


@router.patch("/me/animals/{animal_id}", response_model=AnimalOut)
async def update_animal(
    animal_id: UUID,
    data: AnimalUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = await _get_farm_or_404(db, current_user.id)
    animal = await svc.get_animal(db, farm.id, animal_id)
    if not animal:
        raise HTTPException(status_code=404, detail="Animal not found")
    return await svc.update_animal(db, animal, data)


@router.delete("/me/animals/{animal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_animal(
    animal_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = await _get_farm_or_404(db, current_user.id)
    animal = await svc.get_animal(db, farm.id, animal_id)
    if not animal:
        raise HTTPException(status_code=404, detail="Animal not found")
    await svc.delete_animal(db, animal)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me/tasks", response_model=List[TaskOut])
async def list_tasks(
    status_filter: Optional[str] = Query(None, alias="status"),
    priority: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = await _get_farm_or_404(db, current_user.id)
    return await svc.list_tasks(db, farm.id, status=status_filter, priority=priority, skip=skip, limit=limit)


@router.post("/me/tasks", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
async def create_task(
    data: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = await _get_farm_or_404(db, current_user.id)
    return await svc.create_task(db, farm.id, current_user.id, data)


@router.get("/me/tasks/{task_id}", response_model=TaskOut)
async def get_task(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = await _get_farm_or_404(db, current_user.id)
    task = await svc.get_task(db, farm.id, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.patch("/me/tasks/{task_id}", response_model=TaskOut)
async def update_task(
    task_id: UUID,
    data: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = await _get_farm_or_404(db, current_user.id)
    task = await svc.get_task(db, farm.id, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return await svc.update_task(db, task, data)


@router.delete("/me/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = await _get_farm_or_404(db, current_user.id)
    task = await svc.get_task(db, farm.id, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    await svc.delete_task(db, task)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me/treatments", response_model=List[TreatmentOut])
async def list_treatments(
    animal_id: Optional[UUID] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = await _get_farm_or_404(db, current_user.id)
    return await svc.list_treatments(db, farm.id, animal_id=animal_id, status=status_filter, skip=skip, limit=limit)


@router.post("/me/treatments", response_model=TreatmentOut, status_code=status.HTTP_201_CREATED)
async def create_treatment(
    data: TreatmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = await _get_farm_or_404(db, current_user.id)
    return await svc.create_treatment(db, farm.id, current_user.id, data)


@router.get("/me/treatments/{treatment_id}", response_model=TreatmentOut)
async def get_treatment(
    treatment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = await _get_farm_or_404(db, current_user.id)
    treatment = await svc.get_treatment(db, farm.id, treatment_id)
    if not treatment:
        raise HTTPException(status_code=404, detail="Treatment not found")
    return treatment


@router.patch("/me/treatments/{treatment_id}", response_model=TreatmentOut)
async def update_treatment(
    treatment_id: UUID,
    data: TreatmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = await _get_farm_or_404(db, current_user.id)
    treatment = await svc.get_treatment(db, farm.id, treatment_id)
    if not treatment:
        raise HTTPException(status_code=404, detail="Treatment not found")
    return await svc.update_treatment(db, treatment, data)


@router.get("/me/withdrawals", response_model=List[WithdrawalOut])
async def list_withdrawals(
    animal_id: Optional[UUID] = Query(None),
    violation_only: bool = Query(False),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = await _get_farm_or_404(db, current_user.id)
    return await svc.list_withdrawals(db, farm.id, animal_id=animal_id, violation_only=violation_only, skip=skip, limit=limit)


@router.post("/me/withdrawals", response_model=WithdrawalOut, status_code=status.HTTP_201_CREATED)
async def create_withdrawal(
    data: WithdrawalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = await _get_farm_or_404(db, current_user.id)
    return await svc.create_withdrawal(db, farm.id, data)


@router.post("/me/withdrawals/{withdrawal_id}/collection-attempt", response_model=WithdrawalOut)
async def log_collection_attempt(
    withdrawal_id: UUID,
    data: CollectionAttempt,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = await _get_farm_or_404(db, current_user.id)
    record = await svc.get_withdrawal(db, farm.id, withdrawal_id)
    if not record:
        raise HTTPException(status_code=404, detail="Withdrawal record not found")
    return await svc.log_collection_attempt(db, record, data)


@router.get("/me/alerts", response_model=List[AlertOut])
async def list_alerts(
    unread_only: bool = Query(False),
    severity: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = await _get_farm_or_404(db, current_user.id)
    return await svc.list_alerts(db, farm.id, unread_only=unread_only, severity=severity, skip=skip, limit=limit)


@router.post("/me/alerts/mark-read", status_code=status.HTTP_200_OK)
async def mark_alerts_read(
    data: AlertMarkRead,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = await _get_farm_or_404(db, current_user.id)
    count = await svc.mark_alerts_read(db, farm.id, data.alert_ids)
    return {"marked_read": count}


@router.post("/me/alerts/mark-all-read", status_code=status.HTTP_200_OK)
async def mark_all_alerts_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = await _get_farm_or_404(db, current_user.id)
    count = await svc.mark_all_alerts_read(db, farm.id)
    return {"marked_read": count}


@router.get("/me/vets", response_model=List[VetOptionOut])
async def list_assigned_vets(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = await _get_farm_or_404(db, current_user.id)
    return await svc.list_assigned_vets_for_farm(db, farm.id)


@router.get("/me/appointments/requests", response_model=List[AppointmentRequestOut])
async def list_my_appointment_requests(
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=300),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = await _get_farm_or_404(db, current_user.id)
    return await svc.list_farmer_appointment_requests(
        db,
        farm_id=farm.id,
        farmer_user_id=current_user.id,
        status_filter=status_filter,
        skip=skip,
        limit=limit,
    )


@router.post("/me/appointments/requests", response_model=AppointmentRequestOut, status_code=status.HTTP_201_CREATED)
async def create_appointment_request(
    data: AppointmentRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = await _get_farm_or_404(db, current_user.id)
    try:
        return await svc.create_appointment_request(db, farm.id, current_user.id, data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
