"""Script endpoints — CRUD, AI generation from ideation, and export."""
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.schemas.script import (
    ScriptGenerateRequest,
    ScriptListResponse,
    ScriptResponse,
    ScriptUpdateRequest,
)
from app.services import script_service

router = APIRouter(prefix="/api/v1/scripts", tags=["scripts"])


@router.get("", response_model=ScriptListResponse)
def list_scripts(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    ideation_id: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    return script_service.list_scripts(db, page=page, limit=limit, search=search, ideation_id=ideation_id)


# Static sub-paths before /{script_id}
@router.post("/generate", response_model=ScriptResponse, status_code=201)
def generate_script(
    req: ScriptGenerateRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Generate a video script from an existing ideation item using AI."""
    return script_service.generate_script_from_ideation(db, user_id, str(req.ideation_id), language=req.language)


@router.get("/{script_id}", response_model=ScriptResponse)
def get_script(
    script_id: str,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    return script_service.get_script(db, script_id)


@router.put("/{script_id}", response_model=ScriptResponse)
def update_script(
    script_id: str,
    data: ScriptUpdateRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    return script_service.update_script(db, script_id, user_id, data)


@router.delete("/{script_id}", status_code=204)
def delete_script(
    script_id: str,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    script_service.delete_script(db, script_id)


@router.get("/{script_id}/export")
def export_script(
    script_id: str,
    format: str = Query(default="txt", regex="^(txt|md|pdf)$"),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    """Download a script as .txt, .md, or .pdf."""
    return script_service.export_script(db, script_id, format)
