"""Widen otp_code to store HMAC hashes.

Revision ID: 004
"""
import sqlalchemy as sa
from alembic import op

from app import models  # noqa: F401
from app.db.schema_sync import sync_schema

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    sync_schema(bind)
    if bind.dialect.name == "sqlite":
        return
    op.alter_column(
        "mobile_verifications",
        "otp_code",
        existing_type=sa.String(length=6),
        type_=sa.String(length=64),
        existing_nullable=False,
    )


def downgrade():
    bind = op.get_bind()
    if bind.dialect.name == "sqlite":
        return
    op.alter_column(
        "mobile_verifications",
        "otp_code",
        existing_type=sa.String(length=64),
        type_=sa.String(length=6),
        existing_nullable=False,
    )
