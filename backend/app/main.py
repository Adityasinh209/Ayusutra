from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import settings
from app.db.schema_sync import sync_schema
from app.db.seed import seed
from app.db.session import SessionLocal, engine
from app import models  # noqa: F401


@asynccontextmanager
async def lifespan(_app):
    try:
        sync_schema(engine)
        db = SessionLocal()
        try:
            seed(db)
        finally:
            db.close()
    except Exception as exc:
        import logging

        logging.getLogger("ayursutra").error("Database startup failed: %s", exc)
        raise
    yield


app = FastAPI(title="AyurSutra API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)
