"""Create asset tables: app_tag, app_asset, app_asset_tags

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-28
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ------------------------------------------------------------------ app_tag
    op.create_table(
        "app_tag",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_unique_constraint("uq_app_tag_name", "app_tag", ["name"])
    op.create_unique_constraint("uq_app_tag_slug", "app_tag", ["slug"])

    # Seed predefined tags
    op.execute("""
        INSERT INTO app_tag (id, name, slug) VALUES
        (gen_random_uuid(), 'Product Demo',      'product-demo'),
        (gen_random_uuid(), 'Brand',             'brand'),
        (gen_random_uuid(), 'Tutorial',          'tutorial'),
        (gen_random_uuid(), 'Behind the Scenes', 'behind-the-scenes'),
        (gen_random_uuid(), 'Announcement',      'announcement'),
        (gen_random_uuid(), 'Reels',             'reels'),
        (gen_random_uuid(), 'TikTok',            'tiktok'),
        (gen_random_uuid(), 'YouTube Shorts',    'youtube-shorts'),
        (gen_random_uuid(), 'Campaign',          'campaign'),
        (gen_random_uuid(), 'Archive',           'archive')
    """)

    # ---------------------------------------------------------------- app_asset
    op.create_table(
        "app_asset",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("app_user.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("filename", sa.String(255), nullable=False),
        sa.Column("file_path", sa.String(500), nullable=False),
        sa.Column("file_size_bytes", sa.BigInteger, nullable=False),
        sa.Column("duration_seconds", sa.Float, nullable=True),
        sa.Column("width", sa.Integer, nullable=True),
        sa.Column("height", sa.Integer, nullable=True),
        sa.Column("mime_type", sa.String(100), nullable=True),
        sa.Column("thumbnail_path", sa.String(500), nullable=True),
        sa.Column(
            "updated_by",
            UUID(as_uuid=True),
            sa.ForeignKey("app_user.id"),
            nullable=True,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_app_asset_user_id", "app_asset", ["user_id"])
    op.create_index("idx_app_asset_created_at", "app_asset", ["created_at"])

    # ---------------------------------------------------------- app_asset_tags
    op.create_table(
        "app_asset_tags",
        sa.Column(
            "asset_id",
            UUID(as_uuid=True),
            sa.ForeignKey("app_asset.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "tag_id",
            UUID(as_uuid=True),
            sa.ForeignKey("app_tag.id", ondelete="CASCADE"),
            primary_key=True,
        ),
    )
    op.create_index("idx_app_asset_tags_asset_id", "app_asset_tags", ["asset_id"])
    op.create_index("idx_app_asset_tags_tag_id", "app_asset_tags", ["tag_id"])


def downgrade() -> None:
    op.drop_index("idx_app_asset_tags_tag_id", table_name="app_asset_tags")
    op.drop_index("idx_app_asset_tags_asset_id", table_name="app_asset_tags")
    op.drop_table("app_asset_tags")

    op.drop_index("idx_app_asset_created_at", table_name="app_asset")
    op.drop_index("idx_app_asset_user_id", table_name="app_asset")
    op.drop_table("app_asset")

    op.drop_table("app_tag")
