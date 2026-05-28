"""Ideation endpoints — CRUD, AI generation, and bulk operations."""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.schemas.script import (
    BulkIdsRequest,
    BulkStatusRequest,
    IdeationCreateRequest,
    IdeationGenerateRequest,
    IdeationGenerateResponse,
    IdeationListResponse,
    IdeationResponse,
    IdeationUpdateRequest,
)
from app.services import ideation_service
from app.services.ai_service import get_active_config, generate_ideation_plan

router = APIRouter(prefix="/api/v1/ideations", tags=["ideations"])


@router.get("", response_model=IdeationListResponse)
def list_ideations(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    sort_by: str = Query(default="created_at"),
    sort_dir: str = Query(default="desc"),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    return ideation_service.list_ideations(
        db, page=page, limit=limit, search=search,
        status=status, sort_by=sort_by, sort_dir=sort_dir,
    )


@router.post("", response_model=IdeationResponse, status_code=201)
def create_ideation(
    data: IdeationCreateRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    return ideation_service.create_ideation(db, user_id, data)


# NOTE: static sub-paths (/generate, /bulk-delete, /bulk-status) must be declared
# BEFORE the parameterised route /{ideation_id} so FastAPI doesn't swallow them.

@router.post("/generate", response_model=IdeationGenerateResponse, status_code=201)
def generate_ideations(
    data: IdeationGenerateRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """AI-generate a 7-day content plan and persist each item."""
    config = get_active_config(db)
    raw_items = generate_ideation_plan(
        config,
        niche=data.niche,
        target_audience=data.target_audience,
        platform=data.platform,
        posting_frequency=data.posting_frequency,
        tone_style=data.tone_style,
        week_starting=data.week_starting,
    )

    created = []
    for item_dict in raw_items:
        ideation_orm = ideation_service.create_ideation_from_dict(
            db,
            user_id=user_id,
            data=item_dict,
            niche=data.niche,
            target_audience=data.target_audience,
            platform=data.platform,
            posting_frequency=data.posting_frequency,
            tone_style=data.tone_style,
        )
        created.append(ideation_orm)

    db.commit()
    for item in created:
        db.refresh(item)

    responses = [ideation_service._build_response(i, db) for i in created]
    return IdeationGenerateResponse(items=responses, count=len(responses))


@router.post("/bulk-delete", status_code=200)
def bulk_delete(
    req: BulkIdsRequest,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    count = ideation_service.bulk_delete(db, req)
    return {"deleted": count}


@router.post("/bulk-status", status_code=200)
def bulk_status_update(
    req: BulkStatusRequest,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    count = ideation_service.bulk_update_status(db, req)
    return {"updated": count}


@router.get("/{ideation_id}", response_model=IdeationResponse)
def get_ideation(
    ideation_id: str,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    return ideation_service.get_ideation(db, ideation_id)


@router.put("/{ideation_id}", response_model=IdeationResponse)
def update_ideation(
    ideation_id: str,
    data: IdeationUpdateRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    return ideation_service.update_ideation(db, ideation_id, user_id, data)


@router.delete("/{ideation_id}", status_code=204)
def delete_ideation(
    ideation_id: str,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    ideation_service.delete_ideation(db, ideation_id)
