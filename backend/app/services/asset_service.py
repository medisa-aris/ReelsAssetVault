"""Business logic for video asset CRUD operations."""
from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.asset import AppAsset, AppTag
from app.models.user import AppUser
from app.schemas.asset import AssetListResponse, AssetResponse, AssetUpdateRequest, TagResponse


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _build_response(asset: AppAsset, db: Session) -> AssetResponse:
    """Convert an ORM AppAsset into an AssetResponse dict."""
    # Resolve updated_by_name
    updated_by_name: Optional[str] = None
    if asset.updated_by:
        editor = db.get(AppUser, asset.updated_by)
        updated_by_name = editor.full_name if editor else None
    elif asset.user_id:
        uploader = db.get(AppUser, asset.user_id)
        updated_by_name = uploader.full_name if uploader else None

    thumbnail_url: Optional[str] = None
    if asset.thumbnail_path:
        # thumbnail_path is stored as "uploads/{asset_id}/thumbnail.jpg"
        thumbnail_url = f"/storage/{asset.thumbnail_path}"

    file_url: Optional[str] = None
    if asset.file_path:
        # file_path is stored as "uploads/{asset_id}/original.{ext}"
        file_url = f"/storage/{asset.file_path}"

    return AssetResponse(
        id=asset.id,
        title=asset.title,
        description=asset.description,
        filename=asset.filename,
        file_size_bytes=asset.file_size_bytes,
        duration_seconds=asset.duration_seconds,
        width=asset.width,
        height=asset.height,
        mime_type=asset.mime_type,
        thumbnail_url=thumbnail_url,
        file_url=file_url,
        tags=[TagResponse(id=t.id, name=t.name, slug=t.slug) for t in asset.tags],
        updated_by_name=updated_by_name,
        created_at=asset.created_at,
        updated_at=asset.updated_at,
    )


def _load_asset_or_404(db: Session, asset_id: str) -> AppAsset:
    asset = (
        db.execute(
            select(AppAsset)
            .where(AppAsset.id == UUID(asset_id))
            .options(selectinload(AppAsset.tags))
        )
        .scalars()
        .first()
    )
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


# ---------------------------------------------------------------------------
# Public service functions
# ---------------------------------------------------------------------------

def list_assets(db: Session, page: int = 1, limit: int = 20) -> AssetListResponse:
    """Return a paginated list of all assets (shared library)."""
    offset = (page - 1) * limit

    total: int = db.execute(select(func.count()).select_from(AppAsset)).scalar_one()

    assets = (
        db.execute(
            select(AppAsset)
            .options(selectinload(AppAsset.tags))
            .order_by(AppAsset.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        .scalars()
        .all()
    )

    return AssetListResponse(
        items=[_build_response(a, db) for a in assets],
        total=total,
        page=page,
        limit=limit,
    )


def get_asset(db: Session, asset_id: str) -> AssetResponse:
    """Return a single asset by ID."""
    asset = _load_asset_or_404(db, asset_id)
    return _build_response(asset, db)


def create_asset(
    db: Session,
    *,
    user_id: str,
    title: str,
    description: Optional[str],
    tag_ids: list[str],
    filename: str,
    file_path: str,
    file_size_bytes: int,
    duration_seconds: Optional[float],
    width: Optional[int],
    height: Optional[int],
    mime_type: Optional[str],
    thumbnail_path: Optional[str],
) -> AssetResponse:
    """Persist a new asset record."""
    asset = AppAsset(
        user_id=UUID(user_id),
        title=title.strip(),
        description=description,
        filename=filename,
        file_path=file_path,
        file_size_bytes=file_size_bytes,
        duration_seconds=duration_seconds,
        width=width,
        height=height,
        mime_type=mime_type,
        thumbnail_path=thumbnail_path,
        updated_by=UUID(user_id),
    )

    if tag_ids:
        tags = db.execute(
            select(AppTag).where(AppTag.id.in_([UUID(t) for t in tag_ids]))
        ).scalars().all()
        asset.tags = list(tags)

    db.add(asset)
    db.commit()
    db.refresh(asset)
    return _build_response(asset, db)


def update_asset(
    db: Session,
    asset_id: str,
    user_id: str,
    data: AssetUpdateRequest,
) -> AssetResponse:
    """Update asset metadata (title, description, tags)."""
    asset = _load_asset_or_404(db, asset_id)

    asset.title = data.title.strip()
    asset.description = data.description
    asset.updated_by = UUID(user_id)

    if data.tag_ids is not None:
        tags = db.execute(
            select(AppTag).where(AppTag.id.in_([UUID(str(t)) for t in data.tag_ids]))
        ).scalars().all()
        asset.tags = list(tags)

    db.commit()
    db.refresh(asset)
    return _build_response(asset, db)


def delete_asset(db: Session, asset_id: str) -> None:
    """Hard-delete an asset: removes DB record and files from disk."""
    from app.storage.local_storage import delete_asset_files

    asset = _load_asset_or_404(db, asset_id)
    asset_uuid = str(asset.id)

    db.delete(asset)
    db.commit()

    # Remove files after successful DB deletion
    delete_asset_files(asset_uuid)


def list_tags(db: Session) -> list[TagResponse]:
    """Return all active predefined tags."""
    tags = db.execute(
        select(AppTag).where(AppTag.is_active.is_(True)).order_by(AppTag.name)
    ).scalars().all()
    return [TagResponse(id=t.id, name=t.name, slug=t.slug) for t in tags]
