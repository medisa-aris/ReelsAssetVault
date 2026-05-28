"""Production module API — Publish Schedule endpoints."""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user, require_approver
from app.schemas.schedule import (
    RejectRequest,
    ScheduleCreateRequest,
    ScheduleListResponse,
    ScheduleResponse,
    ScheduleUpdateRequest,
    StatusAdvanceRequest,
)
from app.services import schedule_service

router = APIRouter(prefix="/api/v1/production", tags=["production"])


# ---------------------------------------------------------------------------
# List & Create
# ---------------------------------------------------------------------------


@router.get("/schedules", response_model=ScheduleListResponse)
def list_schedules(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    sort_by: str = Query("scheduled_date"),
    sort_dir: str = Query("asc"),
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ScheduleListResponse:
    return schedule_service.list_schedules(
        db=db,
        page=page,
        limit=limit,
        search=search,
        status=status,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )


@router.post("/schedules", response_model=ScheduleResponse, status_code=201)
def create_schedule(
    data: ScheduleCreateRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ScheduleResponse:
    return schedule_service.create_schedule(db=db, user_id=user_id, data=data)


# ---------------------------------------------------------------------------
# Single record CRUD
# ---------------------------------------------------------------------------


@router.get("/schedules/{schedule_id}", response_model=ScheduleResponse)
def get_schedule(
    schedule_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ScheduleResponse:
    return schedule_service.get_schedule(db=db, schedule_id=schedule_id)


@router.put("/schedules/{schedule_id}", response_model=ScheduleResponse)
def update_schedule(
    schedule_id: str,
    data: ScheduleUpdateRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ScheduleResponse:
    return schedule_service.update_schedule(
        db=db, schedule_id=schedule_id, user_id=user_id, data=data
    )


@router.delete("/schedules/{schedule_id}", status_code=204)
def delete_schedule(
    schedule_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    schedule_service.delete_schedule(db=db, schedule_id=schedule_id, user_id=user_id)


# ---------------------------------------------------------------------------
# Workflow transitions
# ---------------------------------------------------------------------------


@router.patch("/schedules/{schedule_id}/submit", response_model=ScheduleResponse)
def submit_schedule(
    schedule_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ScheduleResponse:
    return schedule_service.submit_schedule(db=db, schedule_id=schedule_id)


@router.patch("/schedules/{schedule_id}/approve", response_model=ScheduleResponse)
def approve_schedule(
    schedule_id: str,
    approver_id: str = Depends(require_approver),
    db: Session = Depends(get_db),
) -> ScheduleResponse:
    return schedule_service.approve_schedule(
        db=db, schedule_id=schedule_id, approver_id=approver_id
    )


@router.patch("/schedules/{schedule_id}/reject", response_model=ScheduleResponse)
def reject_schedule(
    schedule_id: str,
    body: RejectRequest,
    approver_id: str = Depends(require_approver),
    db: Session = Depends(get_db),
) -> ScheduleResponse:
    return schedule_service.reject_schedule(
        db=db,
        schedule_id=schedule_id,
        approver_id=approver_id,
        reason=body.reason,
    )


@router.patch("/schedules/{schedule_id}/status", response_model=ScheduleResponse)
def advance_status(
    schedule_id: str,
    body: StatusAdvanceRequest,
    approver_id: str = Depends(require_approver),
    db: Session = Depends(get_db),
) -> ScheduleResponse:
    return schedule_service.advance_status(
        db=db, schedule_id=schedule_id, new_status=body.status
    )
