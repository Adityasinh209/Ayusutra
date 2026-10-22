import ssl
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings


def _mysql_connect_args(url: str) -> dict:
    if not url.startswith("mysql"):
        return {}
    ctx = ssl.create_default_context()
    ca = settings.mysql_ssl_ca.strip()
    if ca:
        path = Path(ca)
        if path.is_file():
            ctx.load_verify_locations(str(path))
    # Aiven and most cloud MySQL hosts require TLS.
    return {"ssl": ctx}


if settings.database_url.startswith("sqlite") and ":memory:" in settings.database_url:
    engine = create_engine(
        settings.database_url,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
elif settings.database_url.startswith("sqlite"):
    engine = create_engine(settings.database_url, connect_args={"check_same_thread": False})
else:
    engine = create_engine(
        settings.database_url,
        pool_pre_ping=True,
        connect_args=_mysql_connect_args(settings.database_url),
    )
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
