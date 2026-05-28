"""Predefined tag endpoints."""
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.schemas.asset import TagResponse
from app.services import asset_service

router = APIRouter(prefix="/api/v1/tags", tags=["tags"])


@router.get("", response_model=List[TagResponse])
def get_tags(
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    """Return all active predefined tags (for upload / edit tag pickers)."""
    return asset_service.list_tags(db)
