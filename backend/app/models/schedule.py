import uuid
from datetime import datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, Text, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.database import Base


class AppPublishSchedule(Base):
    __tablename__ = "app_publish_schedule"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Linked content (all nullable)
    asset_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("app_asset.id", ondelete="SET NULL"),
        nullable=True,
    )
    ideation_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("app_ideation.id", ondelete="SET NULL"),
        nullable=True,
    )
    script_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("app_script.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Schedule
    scheduled_date: Mapped[datetime] = mapped_column(Date(), nullable=False)
    scheduled_time: Mapped[datetime] = mapped_column(
        Time(), nullable=False, server_default="09:00:00"
    )

    # Content
    caption: Mapped[str | None] = mapped_column(Text(), nullable=True)
    hashtags: Mapped[str | None] = mapped_column(Text(), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text(), nullable=True)

    # Workflow
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, server_default="Draft"
    )
    rejection_reason: Mapped[str | None] = mapped_column(Text(), nullable=True)
    approved_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("app_user.id", ondelete="SET NULL"),
        nullable=True,
    )
    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Ownership
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("app_user.id", ondelete="CASCADE"),
        nullable=False,
    )
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("app_user.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
