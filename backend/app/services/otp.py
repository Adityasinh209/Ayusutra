"""Dummy six-digit OTP. The code is fixed for demos and returned to the client."""

import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.entities import MobileVerification
from app.services.phones import canonical_phone

PURPOSES = {"patient_register", "patient_intake", "therapist_register", "receptionist_register"}
OTP_TTL = timedelta(minutes=5)
RESEND_WAIT = timedelta(seconds=30)


def _now():
    return datetime.now(timezone.utc)


def _aware(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def send_otp(db: Session, mobile: str, purpose: str) -> dict:
    phone = canonical_phone(mobile)
    if purpose not in PURPOSES:
        raise HTTPException(status_code=422, detail="Unknown OTP purpose.")
    now = _now()
    latest = (
        db.query(MobileVerification)
        .filter(MobileVerification.mobile == phone, MobileVerification.purpose == purpose, MobileVerification.consumed == 0)
        .order_by(MobileVerification.created_at.desc())
        .first()
    )
    if latest and _aware(latest.resend_available_at) > now and latest.verified == 0:
        wait = int((_aware(latest.resend_available_at) - now).total_seconds())
        raise HTTPException(status_code=429, detail=f"Wait {max(wait, 1)} seconds before resending the OTP.")
    row = MobileVerification(
        id=f"otp-{int(now.timestamp() * 1000)}",
        mobile=phone,
        purpose=purpose,
        otp_code=settings.dummy_otp,
        expires_at=now + OTP_TTL,
        resend_available_at=now + RESEND_WAIT,
        attempts=0,
        verified=0,
        consumed=0,
    )
    db.add(row)
    db.commit()
    return {
        "sent": True,
        "mobile": phone,
        "purpose": purpose,
        "resendAfterSeconds": 30,
        "expiresInSeconds": 300,
        "debugOtp": settings.dummy_otp,
    }


def verify_otp(db: Session, mobile: str, purpose: str, otp: str) -> dict:
    phone = canonical_phone(mobile)
    now = _now()
    row = (
        db.query(MobileVerification)
        .filter(
            MobileVerification.mobile == phone,
            MobileVerification.purpose == purpose,
            MobileVerification.consumed == 0,
            MobileVerification.verified == 0,
        )
        .order_by(MobileVerification.created_at.desc())
        .first()
    )
    if row is None or _aware(row.expires_at) < now:
        raise HTTPException(status_code=400, detail="OTP expired or was not requested. Send a new code.")
    row.attempts = (row.attempts or 0) + 1
    if (otp or "").strip() != row.otp_code:
        db.commit()
        raise HTTPException(status_code=400, detail="Incorrect OTP.")
    row.verified = 1
    row.verification_token = secrets.token_hex(16)
    db.commit()
    return {"verified": True, "mobile": phone, "purpose": purpose, "verificationToken": row.verification_token}


def consume_verification(db: Session, token: str, mobile: str, purpose: str) -> None:
    phone = canonical_phone(mobile)
    if not token:
        raise HTTPException(status_code=400, detail="Verify the mobile number before completing registration.")
    row = db.query(MobileVerification).filter(MobileVerification.verification_token == token).one_or_none()
    if row is None or row.consumed or not row.verified or row.mobile != phone or row.purpose != purpose:
        raise HTTPException(status_code=400, detail="Mobile verification is incomplete or does not match this number.")
    if _aware(row.expires_at) < _now():
        raise HTTPException(status_code=400, detail="Mobile verification expired. Request a new OTP.")
    row.consumed = 1
