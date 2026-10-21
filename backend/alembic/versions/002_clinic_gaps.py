"""clinic schema gaps: receptionists, billing, inventory, followups, extra columns

Revision ID: 002
"""
from alembic import op

from app import models  # noqa: F401
from app.db.schema_sync import sync_schema

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade():
    sync_schema(op.get_bind())


def downgrade():
    # Column drops are not reversible safely across SQLite; leave tables in place.
    pass
