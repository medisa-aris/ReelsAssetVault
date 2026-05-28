"""Create publish schedule table and reviewer role

Revision ID: 0004
Revises: 0003
Create Date: 2026-05-29
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Seed 'reviewer' role (idempotent — skip if already exists)
    op.execute(
        """
        INSERT INTO app_roles (id, name, description, is_active, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'reviewer',
            'Can approve or reject publish schedule entries',
            true,
            now(),
            now()
        )
        ON CONFLICT (name) DO NOTHING
        """
    )

    op.create_table(
        "app_publish_schedule",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        # Linked content (all nullable — any can be omitted)
        sa.Column(
            "asset_id",
            UUID(as_uuid=True),
            sa.ForeignKey("app_asset.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "ideation_id",
            UUID(as_uuid=True),
            sa.ForeignKey("app_ideation.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "script_id",
            UUID(as_uuid=True),
            sa.ForeignKey("app_script.id", ondelete="SET NULL"),
            nullable=True,
        ),
        # Schedule
        sa.Column("scheduled_date", sa.Date(), nullable=False),
        sa.Column(
            "scheduled_time",
            sa.Time(),
            nullable=False,
            server_default=sa.text("'09:00:00'"),
        ),
        # Content
        sa.Column("caption", sa.Text(), nullable=True),
        sa.Column("hashtags", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        # Workflow
        sa.Column(
            "status",
            sa.String(50),
            nullable=False,
            server_default=sa.text("'Draft'"),
        ),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column(
            "approved_by",
            UUID(as_uuid=True),
            sa.ForeignKey("app_user.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        # Ownership
        sa.Column(
            "user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("app_user.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "updated_by",
            UUID(as_uuid=True),
            sa.ForeignKey("app_user.id", ondelete="SET NULL"),
            nullable=True,
        ),
        # Timestamps
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    op.create_index(
        "idx_app_publish_schedule_status",
        "app_publish_schedule",
        ["status"],
    )
    op.create_index(
        "idx_app_publish_schedule_scheduled_date",
        "app_publish_schedule",
        ["scheduled_date"],
    )
    op.create_index(
        "idx_app_publish_schedule_user_id",
        "app_publish_schedule",
        ["user_id"],
    )


def downgrade() -> None:
    op.drop_index("idx_app_publish_schedule_user_id", table_name="app_publish_schedule")
    op.drop_index(
        "idx_app_publish_schedule_scheduled_date", table_name="app_publish_schedule"
    )
    op.drop_index("idx_app_publish_schedule_status", table_name="app_publish_schedule")
    op.drop_table("app_publish_schedule")
    op.execute("DELETE FROM app_roles WHERE name = 'reviewer'")
