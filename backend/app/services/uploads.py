"""Local report storage. Files stay on disk; MySQL stores the public URL."""

import re
from pathlib import Path

from fastapi import HTTPException, UploadFile

from app.core.config import settings

ALLOWED = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
MAX_BYTES = 5 * 1024 * 1024


def upload_root() -> Path:
    root = Path(settings.upload_dir)
    if not root.is_absolute():
        root = Path(__file__).resolve().parents[2] / settings.upload_dir
    root.mkdir(parents=True, exist_ok=True)
    return root


def save_report(history_id: str, upload: UploadFile) -> tuple[str, str, str]:
    content_type = (upload.content_type or "").split(";")[0].strip().lower()
    if content_type not in ALLOWED:
        raise HTTPException(status_code=422, detail="Reports must be a PDF or an image.")
    data = upload.file.read()
    if not data or len(data) > MAX_BYTES:
        raise HTTPException(status_code=422, detail="Report must be between 1 byte and 5 MB.")
    safe = re.sub(r"[^A-Za-z0-9._-]", "-", upload.filename or "report")[:80]
    stored = f"{history_id}-{int(__import__('time').time() * 1000)}-{safe}"
    if not stored.lower().endswith(ALLOWED[content_type]):
        stored += ALLOWED[content_type]
    folder = upload_root() / "reports"
    folder.mkdir(parents=True, exist_ok=True)
    (folder / stored).write_bytes(data)
    return safe, content_type, stored
