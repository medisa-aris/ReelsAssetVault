"""Business logic for Ideation CRUD and AI generation."""
from __future__ import annotations

from datetime import date, time
from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, or_, select, asc, desc
from sqlalchemy.orm import Session, selectinload

from app.models.script import AppIdeation, app_ideation_tags
from app.models.asset import AppTag
from app.models.user import AppUser
from app.schemas.script import (
    IdeationCreateRequest,
    IdeationGenerateRequest,
    IdeationListResponse,
    IdeationResponse,
    IdeationUpdateRequest,
    BulkIdsRequest,
    BulkStatusRequest,
    TagRef,
)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _build_response(ideation: AppIdeation, db: Session) -> IdeationResponse:
    updated_by_name: Optional[str] = None
    if ideation.updated_by:
        u = db.get(AppUser, ideation.updated_by)
        updated_by_name = u.full_name if u else None
    elif ideation.user_id:
        u = db.get(AppUser, ideation.user_id)
        updated_by_name = u.full_name if u else None

    upload_time_str = None
    if ideation.upload_time:
        t = ideation.upload_time
        upload_time_str = t.strftime("%H:%M") if hasattr(t, "strftime") else str(t)

    return IdeationResponse(
        id=ideation.id,
        user_id=ideation.user_id,
        title=ideation.title,
        niche=ideation.niche,
        target_audience=ideation.target_audience,
        platform=ideation.platform,
        posting_frequency=ideation.posting_frequency,
        tone_style=ideation.tone_style,
        hook=ideation.hook,
        content_summary=ideation.content_summary,
        cta=ideation.cta,
        upload_date=ideation.upload_date,
        upload_time=ideation.upload_time,
        status=ideation.status,
        notes=ideation.notes,
        is_ai_generated=ideation.is_ai_generated,
        tags=[TagRef(id=t.id, name=t.name, slug=t.slug) for t in ideation.tags],
        updated_by_name=updated_by_name,
        created_at=ideation.created_at,
        updated_at=ideation.updated_at,
    )


def _load_or_404(db: Session, ideation_id: str) -> AppIdeation:
    item = (
        db.execute(
            select(AppIdeation)
            .where(AppIdeation.id == UUID(ideation_id))
            .options(selectinload(AppIdeation.tags))
        )
        .scalars()
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Ideation not found")
    return item


def _apply_tags(db: Session, ideation: AppIdeation, tag_ids: list[UUID]) -> None:
    if tag_ids is not None:
        tags = db.execute(
            select(AppTag).where(AppTag.id.in_(tag_ids))
        ).scalars().all()
        ideation.tags = list(tags)


# ---------------------------------------------------------------------------
# Public service functions
# ---------------------------------------------------------------------------

def list_ideations(
    db: Session,
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: str = "created_at",
    sort_dir: str = "desc",
) -> IdeationListResponse:
    q = select(AppIdeation).options(selectinload(AppIdeation.tags))

    if search:
        like = f"%{search}%"
        q = q.where(
            or_(
                AppIdeation.title.ilike(like),
                AppIdeation.content_summary.ilike(like),
                AppIdeation.hook.ilike(like),
            )
        )
    if status:
        q = q.where(AppIdeation.status == status)

    sort_col = AppIdeation.upload_date if sort_by == "upload_date" else AppIdeation.created_at
    q = q.order_by(asc(sort_col) if sort_dir == "asc" else desc(sort_col))

    total = db.execute(
        select(func.count()).select_from(q.subquery())
    ).scalar_one()

    items = db.execute(q.offset((page - 1) * limit).limit(limit)).scalars().all()

    return IdeationListResponse(
        items=[_build_response(i, db) for i in items],
        total=total,
        page=page,
        limit=limit,
    )


def get_ideation(db: Session, ideation_id: str) -> IdeationResponse:
    return _build_response(_load_or_404(db, ideation_id), db)


def create_ideation(
    db: Session,
    user_id: str,
    data: IdeationCreateRequest,
    is_ai_generated: bool = False,
    extra: Optional[dict] = None,
) -> IdeationResponse:
    extra = extra or {}
    ideation = AppIdeation(
        user_id=UUID(user_id),
        title=data.title.strip(),
        platform=getattr(data, "platform", None),
        upload_date=getattr(data, "upload_date", None),
        upload_time=getattr(data, "upload_time", None),
        hook=getattr(data, "hook", None),
        content_summary=getattr(data, "content_summary", None),
        cta=getattr(data, "cta", None),
        notes=getattr(data, "notes", None),
        niche=extra.get("niche"),
        target_audience=extra.get("target_audience"),
        posting_frequency=extra.get("posting_frequency"),
        tone_style=extra.get("tone_style"),
        status="Draft",
        is_ai_generated=is_ai_generated,
        updated_by=UUID(user_id),
    )
    _apply_tags(db, ideation, getattr(data, "tag_ids", []))
    db.add(ideation)
    db.commit()
    db.refresh(ideation)
    return _build_response(ideation, db)


def create_ideation_from_dict(
    db: Session,
    user_id: str,
    data: dict,
    niche: str,
    target_audience: Optional[str],
    platform: str,
    posting_frequency: Optional[str],
    tone_style: Optional[str],
) -> IdeationResponse:
    """Create a single ideation item from an AI-generated dict."""
    from datetime import datetime

    upload_date = None
    if data.get("upload_date"):
        try:
            upload_date = date.fromisoformat(data["upload_date"])
        except ValueError:
            pass

    upload_time = None
    if data.get("upload_time"):
        try:
            t_str = data["upload_time"]
            parts = t_str.split(":")
            upload_time = time(int(parts[0]), int(parts[1]))
        except (ValueError, IndexError):
            pass

    ideation = AppIdeation(
        user_id=UUID(user_id),
        title=str(data.get("title", "Untitled")).strip(),
        niche=niche,
        target_audience=target_audience,
        platform=data.get("platform") or platform,
        posting_frequency=posting_frequency,
        tone_style=tone_style,
        hook=data.get("hook"),
        content_summary=data.get("content_summary"),
        cta=data.get("cta"),
        upload_date=upload_date,
        upload_time=upload_time,
        status="Draft",
        is_ai_generated=True,
        updated_by=UUID(user_id),
    )
    db.add(ideation)
    db.flush()  # get the id
    return ideation  # caller commits


def update_ideation(
    db: Session, ideation_id: str, user_id: str, data: IdeationUpdateRequest
) -> IdeationResponse:
    ideation = _load_or_404(db, ideation_id)
    ideation.title = data.title.strip()
    ideation.platform = data.platform
    ideation.upload_date = data.upload_date
    ideation.upload_time = data.upload_time
    ideation.hook = data.hook
    ideation.content_summary = data.content_summary
    ideation.cta = data.cta
    ideation.notes = data.notes
    ideation.niche = data.niche
    ideation.target_audience = data.target_audience
    ideation.posting_frequency = data.posting_frequency
    ideation.tone_style = data.tone_style
    if data.status:
        ideation.status = data.status
    ideation.updated_by = UUID(user_id)
    _apply_tags(db, ideation, data.tag_ids)
    db.commit()
    db.refresh(ideation)
    return _build_response(ideation, db)


def delete_ideation(db: Session, ideation_id: str) -> None:
    ideation = _load_or_404(db, ideation_id)
    db.delete(ideation)
    db.commit()


def bulk_delete(db: Session, req: BulkIdsRequest) -> int:
    ids = [str(i) for i in req.ids]
    items = db.execute(
        select(AppIdeation).where(AppIdeation.id.in_([UUID(i) for i in ids]))
    ).scalars().all()
    for item in items:
        db.delete(item)
    db.commit()
    return len(items)


def bulk_update_status(db: Session, req: BulkStatusRequest) -> int:
    items = db.execute(
        select(AppIdeation).where(AppIdeation.id.in_([UUID(str(i)) for i in req.ids]))
    ).scalars().all()
    for item in items:
        item.status = req.status
    db.commit()
    return len(items)
