"""Video asset endpoints."""
from __future__ import annotations

from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.schemas.asset import AssetListResponse, AssetResponse, AssetUpdateRequest
from app.services import asset_service
from app.services.metadata_service import extract_metadata, generate_thumbnail
from app.storage.local_storage import (
    get_file_path,
    get_thumbnail_path,
    save_upload,
    UPLOADS_DIR,
)

router = APIRouter(prefix="/api/v1/assets", tags=["assets"])

ALLOWED_MIME_TYPES = {
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/webm",
    "video/avi",
}
ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".webm"}
MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024  # 500 MB


@router.get("", response_model=AssetListResponse)
def get_assets(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    """Return paginated list of all assets (shared library)."""
    return asset_service.list_assets(db, page=page, limit=limit)


@router.post("/upload", response_model=AssetResponse, status_code=201)
async def upload_asset(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    tag_ids: List[str] = Form(default=[]),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Upload a new video asset with metadata."""
    # Validate extension
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{suffix}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Validate MIME type (header-reported, not definitive — extension check is primary)
    content_type = (file.content_type or "").lower()
    if content_type and content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported MIME type '{content_type}'",
        )

    # Validate title
    if not title.strip():
        raise HTTPException(status_code=400, detail="Title is required")

    # We need a placeholder asset_id to build the storage path before DB insert.
    # Use uuid4 directly here and pass it through.
    import uuid
    asset_id = str(uuid.uuid4())

    dest_path = get_file_path(asset_id, suffix)
    bytes_written = await save_upload(file, dest_path)

    # Guard: file size
    if bytes_written > MAX_FILE_SIZE_BYTES:
        dest_path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail="File exceeds 500 MB limit")

    # Extract video metadata
    meta = extract_metadata(str(dest_path))

    # Generate thumbnail
    thumb_path = get_thumbnail_path(asset_id)
    generated = generate_thumbnail(str(dest_path), str(thumb_path))

    # Build relative storage paths (stored in DB, served as /storage/...)
    file_path_rel = str(dest_path.relative_to(UPLOADS_DIR.parent)).replace("\\", "/")
    thumbnail_path_rel: Optional[str] = None
    if generated:
        thumbnail_path_rel = str(thumb_path.relative_to(UPLOADS_DIR.parent)).replace("\\", "/")

    # Persist to DB — reuse the pre-generated asset_id by patching
    from app.models.asset import AppAsset
    from uuid import UUID
    import uuid as _uuid

    asset = AppAsset(
        id=UUID(asset_id),
        user_id=UUID(user_id),
        title=title.strip(),
        description=description,
        filename=file.filename or "upload",
        file_path=file_path_rel,
        file_size_bytes=bytes_written,
        duration_seconds=meta.get("duration_seconds"),
        width=meta.get("width"),
        height=meta.get("height"),
        mime_type=content_type or None,
        thumbnail_path=thumbnail_path_rel,
        updated_by=UUID(user_id),
    )

    if tag_ids:
        from sqlalchemy import select
        from app.models.asset import AppTag
        tags = db.execute(
            select(AppTag).where(AppTag.id.in_([UUID(t) for t in tag_ids if t]))
        ).scalars().all()
        asset.tags = list(tags)

    db.add(asset)
    db.commit()
    db.refresh(asset)

    from app.services.asset_service import _build_response
    return _build_response(asset, db)


@router.get("/{asset_id}", response_model=AssetResponse)
def get_asset(
    asset_id: str,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    """Return a single asset by ID."""
    return asset_service.get_asset(db, asset_id)


@router.put("/{asset_id}", response_model=AssetResponse)
def update_asset(
    asset_id: str,
    data: AssetUpdateRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Update asset metadata (title, description, tags)."""
    return asset_service.update_asset(db, asset_id, user_id, data)


@router.delete("/{asset_id}", status_code=204)
def delete_asset(
    asset_id: str,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    """Hard-delete an asset and all its files."""
    asset_service.delete_asset(db, asset_id)
