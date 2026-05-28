"""SQLAlchemy models for PRD-003: AI Config, Ideation, Script."""
import uuid
from sqlalchemy import (
    String, Text, Boolean, DateTime, Date, Time, ForeignKey, Table, Column
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database import Base

# ---------------------------------------------------------------------------
# Association table: ideation ↔ tag (many-to-many)
# ---------------------------------------------------------------------------
app_ideation_tags = Table(
    "app_ideation_tags",
    Base.metadata,
    Column(
        "ideation_id",
        UUID(as_uuid=True),
        ForeignKey("app_ideation.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "tag_id",
        UUID(as_uuid=True),
        ForeignKey("app_tag.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


# ---------------------------------------------------------------------------
# AppAiConfig — one row per AI provider (claude / chatgpt / ollama / kimi)
# ---------------------------------------------------------------------------
class AppAiConfig(Base):
    __tablename__ = "app_ai_config"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    api_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    base_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("app_user.id"), nullable=True
    )
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# ---------------------------------------------------------------------------
# AppIdeation — one content idea item
# ---------------------------------------------------------------------------
class AppIdeation(Base):
    __tablename__ = "app_ideation"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("app_user.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    niche: Mapped[str | None] = mapped_column(String(255), nullable=True)
    target_audience: Mapped[str | None] = mapped_column(Text, nullable=True)
    platform: Mapped[str | None] = mapped_column(String(100), nullable=True)
    posting_frequency: Mapped[str | None] = mapped_column(String(100), nullable=True)
    tone_style: Mapped[str | None] = mapped_column(String(255), nullable=True)
    hook: Mapped[str | None] = mapped_column(Text, nullable=True)
    content_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    cta: Mapped[str | None] = mapped_column(Text, nullable=True)
    upload_date: Mapped[Date | None] = mapped_column(Date, nullable=True)
    upload_time: Mapped[Time | None] = mapped_column(Time, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="Draft")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_ai_generated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("app_user.id"), nullable=True
    )
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    creator = relationship("AppUser", foreign_keys=[user_id], lazy="select")
    editor = relationship("AppUser", foreign_keys=[updated_by], lazy="select")
    tags = relationship("AppTag", secondary=app_ideation_tags, lazy="selectin")
    scripts = relationship("AppScript", back_populates="ideation", lazy="select")


# ---------------------------------------------------------------------------
# AppScript — one generated or manual script
# ---------------------------------------------------------------------------
class AppScript(Base):
    __tablename__ = "app_script"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ideation_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("app_ideation.id", ondelete="SET NULL"),
        nullable=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("app_user.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    hook_opening: Mapped[str | None] = mapped_column(Text, nullable=True)
    scenes: Mapped[str | None] = mapped_column(Text, nullable=True)
    broll_suggestions: Mapped[str | None] = mapped_column(Text, nullable=True)
    caption_suggestion: Mapped[str | None] = mapped_column(Text, nullable=True)
    cta_ending: Mapped[str | None] = mapped_column(Text, nullable=True)
    hashtags: Mapped[str | None] = mapped_column(Text, nullable=True)
    version_15s: Mapped[str | None] = mapped_column(Text, nullable=True)
    version_30s: Mapped[str | None] = mapped_column(Text, nullable=True)
    version_long: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_ai_generated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("app_user.id"), nullable=True
    )
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    ideation = relationship("AppIdeation", back_populates="scripts", lazy="select")
    creator = relationship("AppUser", foreign_keys=[user_id], lazy="select")
    editor = relationship("AppUser", foreign_keys=[updated_by], lazy="select")
