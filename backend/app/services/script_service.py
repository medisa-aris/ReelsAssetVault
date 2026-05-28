"""Business logic for Script CRUD, AI generation, and export."""
from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import func, or_, select, desc
from sqlalchemy.orm import Session, selectinload

from app.models.script import AppScript, AppIdeation
from app.models.user import AppUser
from app.schemas.script import (
    ScriptListResponse,
    ScriptResponse,
    ScriptUpdateRequest,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _build_response(script: AppScript, db: Session) -> ScriptResponse:
    updated_by_name: Optional[str] = None
    if script.updated_by:
        u = db.get(AppUser, script.updated_by)
        updated_by_name = u.full_name if u else None
    elif script.user_id:
        u = db.get(AppUser, script.user_id)
        updated_by_name = u.full_name if u else None

    ideation_title: Optional[str] = None
    if script.ideation_id:
        ideation = db.get(AppIdeation, script.ideation_id)
        ideation_title = ideation.title if ideation else None

    return ScriptResponse(
        id=script.id,
        ideation_id=script.ideation_id,
        ideation_title=ideation_title,
        user_id=script.user_id,
        title=script.title,
        hook_opening=script.hook_opening,
        scenes=script.scenes,
        broll_suggestions=script.broll_suggestions,
        caption_suggestion=script.caption_suggestion,
        cta_ending=script.cta_ending,
        hashtags=script.hashtags,
        version_15s=script.version_15s,
        version_30s=script.version_30s,
        version_long=script.version_long,
        is_ai_generated=script.is_ai_generated,
        updated_by_name=updated_by_name,
        created_at=script.created_at,
        updated_at=script.updated_at,
    )


def _load_or_404(db: Session, script_id: str) -> AppScript:
    script = db.execute(
        select(AppScript).where(AppScript.id == UUID(script_id))
    ).scalars().first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    return script


# ---------------------------------------------------------------------------
# Public service functions
# ---------------------------------------------------------------------------

def list_scripts(
    db: Session,
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    ideation_id: Optional[str] = None,
) -> ScriptListResponse:
    q = select(AppScript)

    if search:
        like = f"%{search}%"
        q = q.where(
            or_(AppScript.title.ilike(like), AppScript.scenes.ilike(like))
        )
    if ideation_id:
        q = q.where(AppScript.ideation_id == UUID(ideation_id))

    q = q.order_by(desc(AppScript.created_at))

    total = db.execute(select(func.count()).select_from(q.subquery())).scalar_one()
    items = db.execute(q.offset((page - 1) * limit).limit(limit)).scalars().all()

    return ScriptListResponse(
        items=[_build_response(s, db) for s in items],
        total=total,
        page=page,
        limit=limit,
    )


def get_script(db: Session, script_id: str) -> ScriptResponse:
    return _build_response(_load_or_404(db, script_id), db)


def generate_script_from_ideation(
    db: Session, user_id: str, ideation_id: str, language: str = "en"
) -> ScriptResponse:
    """Call AI to generate a script from an existing ideation, then persist it."""
    from app.services.ai_service import get_active_config, generate_script_for_ideation

    ideation = db.execute(
        select(AppIdeation).where(AppIdeation.id == UUID(ideation_id))
    ).scalars().first()
    if not ideation:
        raise HTTPException(status_code=404, detail="Ideation not found")

    config = get_active_config(db)
    script_data = generate_script_for_ideation(config, ideation, language=language)

    script = AppScript(
        ideation_id=ideation.id,
        user_id=UUID(user_id),
        title=f"Script: {ideation.title}",
        hook_opening=script_data.get("hook_opening"),
        scenes=script_data.get("scenes"),
        broll_suggestions=script_data.get("broll_suggestions"),
        caption_suggestion=script_data.get("caption_suggestion"),
        cta_ending=script_data.get("cta_ending"),
        hashtags=script_data.get("hashtags"),
        version_15s=script_data.get("version_15s"),
        version_30s=script_data.get("version_30s"),
        version_long=script_data.get("version_long"),
        is_ai_generated=True,
        updated_by=UUID(user_id),
    )
    db.add(script)

    # Update ideation status
    ideation.status = "Script Generated"

    db.commit()
    db.refresh(script)
    return _build_response(script, db)


def update_script(
    db: Session, script_id: str, user_id: str, data: ScriptUpdateRequest
) -> ScriptResponse:
    script = _load_or_404(db, script_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(script, field, value)
    script.updated_by = UUID(user_id)
    db.commit()
    db.refresh(script)
    return _build_response(script, db)


def delete_script(db: Session, script_id: str) -> None:
    script = _load_or_404(db, script_id)
    db.delete(script)
    db.commit()


# ---------------------------------------------------------------------------
# Export
# ---------------------------------------------------------------------------

def _script_as_text(script: AppScript) -> str:
    lines = [f"SCRIPT: {script.title}", "=" * 60, ""]
    sections = [
        ("HOOK OPENING", script.hook_opening),
        ("SCENES", script.scenes),
        ("B-ROLL SUGGESTIONS", script.broll_suggestions),
        ("CAPTION", script.caption_suggestion),
        ("CTA ENDING", script.cta_ending),
        ("HASHTAGS", script.hashtags),
        ("15s VERSION", script.version_15s),
        ("30s VERSION", script.version_30s),
        ("LONG-FORM VERSION", script.version_long),
    ]
    for heading, content in sections:
        if content:
            lines += [f"--- {heading} ---", content, ""]
    return "\n".join(lines)


def _script_as_markdown(script: AppScript) -> str:
    lines = [f"# {script.title}", ""]
    sections = [
        ("Hook Opening", script.hook_opening),
        ("Scenes", script.scenes),
        ("B-roll Suggestions", script.broll_suggestions),
        ("Caption", script.caption_suggestion),
        ("CTA Ending", script.cta_ending),
        ("Hashtags", script.hashtags),
        ("15s Version", script.version_15s),
        ("30s Version", script.version_30s),
        ("Long-form Version", script.version_long),
    ]
    for heading, content in sections:
        if content:
            lines += [f"## {heading}", "", content, ""]
    return "\n".join(lines)


def _script_as_pdf(script: AppScript) -> bytes:
    from io import BytesIO
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )
    styles = getSampleStyleSheet()
    body_style = ParagraphStyle("body", parent=styles["Normal"], fontSize=10, leading=14)

    story = [Paragraph(script.title, styles["Title"]), Spacer(1, 0.4 * cm)]
    sections = [
        ("Hook Opening", script.hook_opening),
        ("Scenes", script.scenes),
        ("B-roll Suggestions", script.broll_suggestions),
        ("Caption", script.caption_suggestion),
        ("CTA Ending", script.cta_ending),
        ("Hashtags", script.hashtags),
        ("15s Version", script.version_15s),
        ("30s Version", script.version_30s),
        ("Long-form Version", script.version_long),
    ]
    for heading, content in sections:
        if content:
            story.append(Paragraph(heading, styles["Heading2"]))
            safe = content.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            safe = safe.replace("\n", "<br/>")
            story.append(Paragraph(safe, body_style))
            story.append(Spacer(1, 0.3 * cm))

    doc.build(story)
    return buffer.getvalue()


def export_script(db: Session, script_id: str, fmt: str) -> StreamingResponse:
    script = _load_or_404(db, script_id)
    safe_title = script.title.replace(" ", "_")[:40]

    if fmt == "txt":
        content = _script_as_text(script)
        return StreamingResponse(
            iter([content.encode("utf-8")]),
            media_type="text/plain",
            headers={"Content-Disposition": f'attachment; filename="{safe_title}.txt"'},
        )
    elif fmt == "md":
        content = _script_as_markdown(script)
        return StreamingResponse(
            iter([content.encode("utf-8")]),
            media_type="text/markdown",
            headers={"Content-Disposition": f'attachment; filename="{safe_title}.md"'},
        )
    elif fmt == "pdf":
        pdf_bytes = _script_as_pdf(script)
        return StreamingResponse(
            iter([pdf_bytes]),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{safe_title}.pdf"'},
        )
    else:
        raise HTTPException(status_code=400, detail="Format must be txt, md, or pdf")
