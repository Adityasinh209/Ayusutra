import logging
import ssl
from pathlib import Path

import certifi
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings

logger = logging.getLogger("ayursutra")


def _ca_candidates() -> list[Path]:
    paths: list[Path] = []
    if settings.mysql_ssl_ca.strip():
        paths.append(Path(settings.mysql_ssl_ca.strip()))
    paths.extend([
        Path(__file__).resolve().parents[1] / "certs" / "aiven-ca.pem",
        Path("/etc/secrets/aiven-ca.pem"),
        Path("/etc/secrets/ca.pem"),
    ])
    return paths


def _mysql_connect_args(url: str) -> dict:
    if not url.startswith("mysql"):
        return {}

    ctx = ssl.create_default_context(cafile=certifi.where())
    loaded_ca = False
    for path in _ca_candidates():
        if path.is_file():
            ctx.load_verify_locations(str(path))
            loaded_ca = True
            logger.info("MySQL SSL using CA file: %s", path)
            break

    is_aiven = "aivencloud.com" in url
    if is_aiven and not loaded_ca and settings.mysql_ssl_skip_verify:
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        logger.warning(
            "MYSQL_SSL_SKIP_VERIFY is enabled; Aiven TLS is encrypted but not verified. "
            "Add backend/certs/aiven-ca.pem or set MYSQL_SSL_CA for production."
        )
    elif is_aiven and not loaded_ca:
        # Capstone default: Aiven uses a project CA not in certifi; allow connect without manual CA upload.
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        logger.warning(
            "No Aiven CA file found; using TLS without certificate verification. "
            "Download CA from Aiven → Connection information and save as backend/certs/aiven-ca.pem."
        )

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
