"""Idempotent ADD COLUMN / CREATE TABLE for existing databases.

create_all only creates missing tables; it does not add columns to existing ones.
"""

from sqlalchemy import Integer, Numeric, String, Text, inspect, text
from sqlalchemy.engine import Connection, Engine

from app.db.base import Base


def _sqlite_default(column) -> str:
    """Default needed so SQLite can ADD a column onto a table that already has rows."""
    if column.server_default is not None:
        return f" DEFAULT {column.server_default.arg}"
    if column.default is not None and getattr(column.default, "is_scalar", False):
        val = column.default.arg
        if isinstance(val, str):
            return f" DEFAULT '{val}'"
        if isinstance(val, (int, float)):
            return f" DEFAULT {val}"
    if isinstance(column.type, Integer):
        return " DEFAULT 0"
    if isinstance(column.type, Numeric):
        return " DEFAULT 0"
    if isinstance(column.type, (String, Text)):
        return " DEFAULT ''"
    return ""


def sync_schema(bind: Engine | Connection) -> None:
    """Create missing tables, then add any missing columns declared on models."""
    Base.metadata.create_all(bind)
    if isinstance(bind, Engine):
        with bind.begin() as conn:
            _add_missing_columns(conn)
    else:
        _add_missing_columns(bind)


def _add_missing_columns(conn: Connection) -> None:
    inspector = inspect(conn)
    dialect = conn.dialect
    for table in Base.metadata.sorted_tables:
        if not inspector.has_table(table.name):
            continue
        existing = {c["name"] for c in inspector.get_columns(table.name)}
        for column in table.columns:
            if column.name in existing:
                continue
            type_sql = column.type.compile(dialect=dialect)
            default = _sqlite_default(column) if dialect.name == "sqlite" else ""
            if dialect.name != "sqlite" and column.server_default is not None:
                default = f" DEFAULT {column.server_default.arg}"
            sql = f"ALTER TABLE {table.name} ADD COLUMN {column.name} {type_sql}{default}"
            conn.execute(text(sql))
