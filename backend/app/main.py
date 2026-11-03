from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes import router
from app.api.workflow import router as workflow_router
from app.core.config import settings
from app.db.schema_sync import sync_schema
from app.db.seed import seed
from app.db.session import SessionLocal, engine
from app.services.uploads import upload_root
from app import models  # noqa: F401


@asynccontextmanager
async def lifespan(_app):
    import logging

    log = logging.getLogger("ayursutra")
    try:
        sync_schema(engine)
    except Exception as exc:
        log.error("Database schema sync failed: %s", exc, exc_info=True)
        raise
    db = SessionLocal()
    try:
        try:
            seed(db)
        except Exception as exc:
            db.rollback()
            log.error("Demo seed failed (API will still start): %s", exc, exc_info=True)
    finally:
        db.close()
    yield


app = FastAPI(title="AyurSutra API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)
app.include_router(router)
app.include_router(workflow_router)
app.mount("/uploads", StaticFiles(directory=str(upload_root())), name="uploads")
