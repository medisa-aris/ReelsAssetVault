"""Admin endpoints — AI provider configuration (admin role only)."""
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import require_admin
from app.models.script import AppAiConfig
from app.schemas.script import AiConfigResponse, AiConfigUpdateRequest, AiTestRequest
from app.services.ai_service import get_all_configs, test_connection

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


def _to_response(cfg: AppAiConfig) -> AiConfigResponse:
    # Mask API key — show only last 4 chars
    masked: str | None = None
    if cfg.api_key:
        masked = "••••" + cfg.api_key[-4:] if len(cfg.api_key) > 4 else "••••"
    return AiConfigResponse(
        id=cfg.id,
        provider=cfg.provider,
        api_key=masked,
        model=cfg.model,
        base_url=cfg.base_url,
        is_active=cfg.is_active,
        updated_at=cfg.updated_at,
    )


@router.get("/ai-config", response_model=List[AiConfigResponse])
def list_ai_configs(
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    """List all AI provider configs (admin only)."""
    return [_to_response(c) for c in get_all_configs(db)]


@router.put("/ai-config/{config_id}", response_model=AiConfigResponse)
def update_ai_config(
    config_id: UUID,
    data: AiConfigUpdateRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(require_admin),
):
    """Update API key, model, or base_url for a provider (admin only)."""
    cfg = db.execute(
        select(AppAiConfig).where(AppAiConfig.id == config_id)
    ).scalars().first()
    if not cfg:
        raise HTTPException(status_code=404, detail="AI config not found")

    if data.api_key is not None:
        cfg.api_key = data.api_key or None
    if data.model is not None:
        cfg.model = data.model or None
    if data.base_url is not None:
        cfg.base_url = data.base_url or None

    from uuid import UUID as _UUID
    cfg.updated_by = _UUID(user_id)
    db.commit()
    db.refresh(cfg)
    return _to_response(cfg)


@router.patch("/ai-config/{config_id}/activate", response_model=AiConfigResponse)
def activate_ai_config(
    config_id: UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(require_admin),
):
    """Set one provider as active; deactivate all others (admin only)."""
    cfg = db.execute(
        select(AppAiConfig).where(AppAiConfig.id == config_id)
    ).scalars().first()
    if not cfg:
        raise HTTPException(status_code=404, detail="AI config not found")

    # Deactivate all
    all_cfgs = db.execute(select(AppAiConfig)).scalars().all()
    for c in all_cfgs:
        c.is_active = False

    cfg.is_active = True
    from uuid import UUID as _UUID
    cfg.updated_by = _UUID(user_id)
    db.commit()
    db.refresh(cfg)
    return _to_response(cfg)


@router.post("/ai-config/test")
def test_ai_config(
    req: AiTestRequest,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    """Test connectivity to the active (or specified) AI provider (admin only)."""
    if req.provider_id:
        cfg = db.execute(
            select(AppAiConfig).where(AppAiConfig.id == req.provider_id)
        ).scalars().first()
        if not cfg:
            raise HTTPException(status_code=404, detail="AI config not found")
    else:
        from app.services.ai_service import get_active_config
        cfg = get_active_config(db)

    try:
        response = test_connection(cfg)
        return {"success": True, "message": response}
    except Exception as exc:
        return {"success": False, "message": str(exc)}
