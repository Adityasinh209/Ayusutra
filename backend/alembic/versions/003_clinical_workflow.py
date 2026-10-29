"""OTP, therapist availability, and previous treatment history.

Revision ID: 003
"""
from alembic import op

from app import models  # noqa: F401
from app.db.schema_sync import sync_schema

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade():
    sync_schema(op.get_bind())


def downgrade():
    pass
