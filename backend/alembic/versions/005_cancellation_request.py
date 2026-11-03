"""Add appointment cancellation_request.

Revision ID: 005
"""
from alembic import op

from app import models  # noqa: F401
from app.db.schema_sync import sync_schema

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade():
    sync_schema(op.get_bind())


def downgrade():
    pass
