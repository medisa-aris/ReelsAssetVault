"""Business logic for the Production > Publish Schedule feature."""
from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.asset import AppAsset
from app.models.schedule import AppPublishSchedule
from app.models.script import AppIdeation, AppScript
from app.schemas.schedule import (
    ScheduleCreateRequest,
    ScheduleListResponse,
    ScheduleResponse,
    ScheduleUpdateRequest,
)

# Statuses that lock the record from ordinary edits and deletes
LOCKED_STATUSES = {"Approved", "Scheduled", "Published"}

VALID_ADVANCE_TARGETS = {"Scheduled", "Published"}

# Allowed predecessor for each advance target
_ADVANCE_PREREQS: dict[str, str] = {
    "Scheduled": "Approved",
    "Published": "Scheduled",
}


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _build_response(row: AppPublishSchedule, db: Session) -> ScheduleResponse:
    """Flatten FK joins into a ScheduleResponse."""
    asset_title: Optional[str] = None
    asset_thumbnail_url: Optional[str] = None
    if row.asset_id:
        asset = db.get(AppAsset, row.asset_id)
        if asset:
            asset_title = asset.title
            if asset.thumbnail_path:
                asset_thumbnail_url = f"/storage/{asset.thumbnail_path}"

    ideation_title: Optional[str] = None
    if row.ideation_id:
        ideation = db.get(AppIdeation, row.ideation_id)
        if ideation:
            ideation_title = ideation.title

    script_title: Optional[str] = None
    if row.script_id:
        script = db.get(AppScript, row.script_id)
        if script:
            script_title = script.title

    # Normalise scheduled_time to "HH:MM" string
    raw_time = row.scheduled_time
    if hasattr(raw_time, "strftime"):
        scheduled_time_str = raw_time.strftime("%H:%M")
    else:
        scheduled_time_str = str(raw_time)[:5]  # "09:00:00" → "09:00"

    # Normalise scheduled_date to a date object
    raw_date = row.scheduled_date
    if isinstance(raw_date, datetime):
        scheduled_date_val = raw_date.date()
    else:
        scheduled_date_val = raw_date  # already date

    return ScheduleResponse(
        id=row.id,
        asset_id=row.asset_id,
        asset_title=asset_title,
        asset_thumbnail_url=asset_thumbnail_url,
        ideation_id=row.ideation_id,
        ideation_title=ideation_title,
        script_id=row.script_id,
        script_title=script_title,
        scheduled_date=scheduled_date_val,
        scheduled_time=scheduled_time_str,
        caption=row.caption,
        hashtags=row.hashtags,
        notes=row.notes,
        status=row.status,
        rejection_reason=row.rejection_reason,
        approved_by=row.approved_by,
        approved_at=row.approved_at,
        user_id=row.user_id,
        updated_by=row.updated_by,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def _load_or_404(db: Session, schedule_id: str) -> AppPublishSchedule:
    try:
        uid = UUID(schedule_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Schedule not found")
    row = db.get(AppPublishSchedule, uid)
    if not row:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return row


# ---------------------------------------------------------------------------
# Public service functions
# ---------------------------------------------------------------------------


def list_schedules(
    db: Session,
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: str = "scheduled_date",
    sort_dir: str = "asc",
) -> ScheduleListResponse:
    query = db.query(AppPublishSchedule)

    if search:
        query = query.filter(AppPublishSchedule.caption.ilike(f"%{search}%"))

    if status:
        query = query.filter(AppPublishSchedule.status == status)

    # Sorting
    sort_col = getattr(AppPublishSchedule, sort_by, AppPublishSchedule.scheduled_date)
    if sort_dir.lower() == "desc":
        query = query.order_by(sort_col.desc())
    else:
        query = query.order_by(sort_col.asc())

    total: int = query.count()
    rows = query.offset((page - 1) * limit).limit(limit).all()

    return ScheduleListResponse(
        items=[_build_response(r, db) for r in rows],
        total=total,
        page=page,
        limit=limit,
    )


def get_schedule(db: Session, schedule_id: str) -> ScheduleResponse:
    row = _load_or_404(db, schedule_id)
    return _build_response(row, db)


def create_schedule(
    db: Session,
    user_id: str,
    data: ScheduleCreateRequest,
) -> ScheduleResponse:
    # Build time string to store (always "HH:MM:SS")
    raw_time = data.scheduled_time
    if len(raw_time) == 5:
        raw_time = raw_time + ":00"

    row = AppPublishSchedule(
        asset_id=data.asset_id,
        ideation_id=data.ideation_id,
        script_id=data.script_id,
        scheduled_date=data.scheduled_date,
        scheduled_time=raw_time,
        caption=data.caption,
        hashtags=data.hashtags,
        notes=data.notes,
        status="Draft",
        user_id=UUID(user_id),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _build_response(row, db)


def update_schedule(
    db: Session,
    schedule_id: str,
    user_id: str,
    data: ScheduleUpdateRequest,
) -> ScheduleResponse:
    row = _load_or_404(db, schedule_id)

    if row.status in LOCKED_STATUSES:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot edit a schedule with status '{row.status}'",
        )

    if data.scheduled_date is not None:
        row.scheduled_date = data.scheduled_date
    if data.scheduled_time is not None:
        t = data.scheduled_time
        row.scheduled_time = t if len(t) == 8 else t + ":00"
    if data.caption is not None:
        row.caption = data.caption
    if data.hashtags is not None:
        row.hashtags = data.hashtags
    if data.notes is not None:
        row.notes = data.notes

    row.updated_by = UUID(user_id)
    db.commit()
    db.refresh(row)
    return _build_response(row, db)


def delete_schedule(db: Session, schedule_id: str, user_id: str) -> None:
    row = _load_or_404(db, schedule_id)

    if row.status in LOCKED_STATUSES:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot delete a schedule with status '{row.status}'",
        )

    db.delete(row)
    db.commit()


def submit_schedule(db: Session, schedule_id: str) -> ScheduleResponse:
    """Advance Draft or Rejected → Pending Review."""
    row = _load_or_404(db, schedule_id)

    if row.status not in {"Draft", "Rejected"}:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot submit a schedule with status '{row.status}'",
        )

    row.status = "Pending Review"
    # Clear rejection reason on re-submit
    row.rejection_reason = None
    db.commit()
    db.refresh(row)
    return _build_response(row, db)


def approve_schedule(db: Session, schedule_id: str, approver_id: str) -> ScheduleResponse:
    row = _load_or_404(db, schedule_id)

    if row.status != "Pending Review":
        raise HTTPException(
            status_code=409,
            detail=f"Cannot approve a schedule with status '{row.status}'",
        )

    row.status = "Approved"
    row.approved_by = UUID(approver_id)
    row.approved_at = datetime.now(timezone.utc)
    row.updated_by = UUID(approver_id)
    db.commit()
    db.refresh(row)
    return _build_response(row, db)


def reject_schedule(
    db: Session,
    schedule_id: str,
    approver_id: str,
    reason: str,
) -> ScheduleResponse:
    row = _load_or_404(db, schedule_id)

    if row.status != "Pending Review":
        raise HTTPException(
            status_code=409,
            detail=f"Cannot reject a schedule with status '{row.status}'",
        )

    row.status = "Rejected"
    row.rejection_reason = reason
    row.approved_by = None
    row.approved_at = None
    row.updated_by = UUID(approver_id)
    db.commit()
    db.refresh(row)
    return _build_response(row, db)


def advance_status(
    db: Session,
    schedule_id: str,
    new_status: str,
) -> ScheduleResponse:
    """Advance Approved → Scheduled or Scheduled → Published."""
    if new_status not in VALID_ADVANCE_TARGETS:
        raise HTTPException(
            status_code=422,
            detail=f"status must be one of {sorted(VALID_ADVANCE_TARGETS)}",
        )

    row = _load_or_404(db, schedule_id)
    required = _ADVANCE_PREREQS[new_status]

    if row.status != required:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot advance to '{new_status}' from '{row.status}' (requires '{required}')",
        )

    row.status = new_status
    db.commit()
    db.refresh(row)
    return _build_response(row, db)
