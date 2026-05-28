"""Create script tables: app_ai_config, app_ideation, app_ideation_tags, app_script

Revision ID: 0003
Revises: 0002
Create Date: 2026-05-28
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ---------------------------------------------------------- app_ai_config
    op.create_table(
        "app_ai_config",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("provider", sa.String(50), nullable=False),
        sa.Column("api_key", sa.Text, nullable=True),
        sa.Column("model", sa.String(100), nullable=True),
        sa.Column("base_url", sa.String(500), nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("updated_by", UUID(as_uuid=True), sa.ForeignKey("app_user.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_unique_constraint("uq_app_ai_config_provider", "app_ai_config", ["provider"])

    # Seed one row per provider (all inactive)
    op.execute("""
        INSERT INTO app_ai_config (id, provider, model, base_url) VALUES
        (gen_random_uuid(), 'claude',  'claude-opus-4-5',     NULL),
        (gen_random_uuid(), 'chatgpt', 'gpt-4o',              NULL),
        (gen_random_uuid(), 'ollama',  'llama3.2',            'http://localhost:11434/v1'),
        (gen_random_uuid(), 'kimi',    'moonshot-v1-8k',      'https://api.moonshot.cn/v1')
    """)

    # --------------------------------------------------------- app_ideation
    op.create_table(
        "app_ideation",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("app_user.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("niche", sa.String(255), nullable=True),
        sa.Column("target_audience", sa.Text, nullable=True),
        sa.Column("platform", sa.String(100), nullable=True),
        sa.Column("posting_frequency", sa.String(100), nullable=True),
        sa.Column("tone_style", sa.String(255), nullable=True),
        sa.Column("hook", sa.Text, nullable=True),
        sa.Column("content_summary", sa.Text, nullable=True),
        sa.Column("cta", sa.Text, nullable=True),
        sa.Column("upload_date", sa.Date, nullable=True),
        sa.Column("upload_time", sa.Time, nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default=sa.text("'Draft'")),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("is_ai_generated", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("updated_by", UUID(as_uuid=True), sa.ForeignKey("app_user.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_app_ideation_user_id",    "app_ideation", ["user_id"])
    op.create_index("idx_app_ideation_status",      "app_ideation", ["status"])
    op.create_index("idx_app_ideation_upload_date", "app_ideation", ["upload_date"])

    # ---------------------------------------------------- app_ideation_tags
    op.create_table(
        "app_ideation_tags",
        sa.Column("ideation_id", UUID(as_uuid=True), sa.ForeignKey("app_ideation.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("tag_id",      UUID(as_uuid=True), sa.ForeignKey("app_tag.id",      ondelete="CASCADE"), primary_key=True),
    )
    op.create_index("idx_app_ideation_tags_ideation_id", "app_ideation_tags", ["ideation_id"])
    op.create_index("idx_app_ideation_tags_tag_id",      "app_ideation_tags", ["tag_id"])

    # ---------------------------------------------------------- app_script
    op.create_table(
        "app_script",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("ideation_id", UUID(as_uuid=True), sa.ForeignKey("app_ideation.id", ondelete="SET NULL"), nullable=True),
        sa.Column("user_id",     UUID(as_uuid=True), sa.ForeignKey("app_user.id",     ondelete="CASCADE"), nullable=False),
        sa.Column("title",              sa.String(255), nullable=False),
        sa.Column("hook_opening",       sa.Text, nullable=True),
        sa.Column("scenes",             sa.Text, nullable=True),
        sa.Column("broll_suggestions",  sa.Text, nullable=True),
        sa.Column("caption_suggestion", sa.Text, nullable=True),
        sa.Column("cta_ending",         sa.Text, nullable=True),
        sa.Column("hashtags",           sa.Text, nullable=True),
        sa.Column("version_15s",        sa.Text, nullable=True),
        sa.Column("version_30s",        sa.Text, nullable=True),
        sa.Column("version_long",       sa.Text, nullable=True),
        sa.Column("is_ai_generated",    sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("updated_by", UUID(as_uuid=True), sa.ForeignKey("app_user.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_app_script_ideation_id", "app_script", ["ideation_id"])
    op.create_index("idx_app_script_user_id",     "app_script", ["user_id"])


def downgrade() -> None:
    op.drop_index("idx_app_script_user_id",     table_name="app_script")
    op.drop_index("idx_app_script_ideation_id", table_name="app_script")
    op.drop_table("app_script")

    op.drop_index("idx_app_ideation_tags_tag_id",      table_name="app_ideation_tags")
    op.drop_index("idx_app_ideation_tags_ideation_id", table_name="app_ideation_tags")
    op.drop_table("app_ideation_tags")

    op.drop_index("idx_app_ideation_upload_date", table_name="app_ideation")
    op.drop_index("idx_app_ideation_status",      table_name="app_ideation")
    op.drop_index("idx_app_ideation_user_id",     table_name="app_ideation")
    op.drop_table("app_ideation")

    op.drop_table("app_ai_config")
