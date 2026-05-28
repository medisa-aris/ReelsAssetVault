"""Create auth tables: app_user, app_roles, app_user_roles

Revision ID: 0001
Revises:
Create Date: 2026-05-28
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    op.create_table(
        "app_roles",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_unique_constraint("uq_app_roles_name", "app_roles", ["name"])

    op.create_table(
        "app_user",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("password", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_unique_constraint("uq_app_user_email", "app_user", ["email"])
    op.create_index("idx_app_user_email", "app_user", ["email"])

    op.create_table(
        "app_user_roles",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("app_user.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role_id", UUID(as_uuid=True), sa.ForeignKey("app_roles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("assigned_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("assigned_by", UUID(as_uuid=True), sa.ForeignKey("app_user.id"), nullable=True),
    )
    op.create_unique_constraint("uq_user_role", "app_user_roles", ["user_id", "role_id"])
    op.create_index("idx_app_user_roles_user_id", "app_user_roles", ["user_id"])
    op.create_index("idx_app_user_roles_role_id", "app_user_roles", ["role_id"])

    op.execute("""
        INSERT INTO app_roles (id, name, description) VALUES
        (gen_random_uuid(), 'admin',  'Full access to all features and user management'),
        (gen_random_uuid(), 'editor', 'Can upload, edit, and delete own assets'),
        (gen_random_uuid(), 'viewer', 'Read-only access to assets')
    """)


def downgrade() -> None:
    op.drop_table("app_user_roles")
    op.drop_index("idx_app_user_email", table_name="app_user")
    op.drop_table("app_user")
    op.drop_table("app_roles")
