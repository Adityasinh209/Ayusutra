"""OTP generation, hashed storage, and Fast2SMS delivery."""

import hashlib
import hmac
import logging
import secrets
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.entities import MobileVerification
from app.services.phones import canonical_phone

log = logging.getLogger("ayursutra.otp")

PURPOSES = {
    "patient_register",
    "patient_intake",
    "therapist_register",
    "receptionist_register",
    "emergency_contact",
}
OTP_TTL = timedelta(minutes=5)
RESEND_WAIT = timedelta(seconds=30)
FAST2SMS_URL = "https://www.fast2sms.com/dev/bulkV2"
FAST2SMS_OTP_URL = "https://www.fast2sms.com/dev/otp/send"


def _now():
    return datetime.now(timezone.utc)


def _aware(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def _hash_otp(code: str) -> str:
    secret = (settings.otp_hmac_secret or settings.clerk_secret_key or "ayursutra-otp").encode()
    return hmac.new(secret, code.encode(), hashlib.sha256).hexdigest()


def _generate_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def _sms_message(data: dict) -> str:
    message = data.get("message")
    if isinstance(message, list):
        return ", ".join(str(item) for item in message if item).strip()
    return str(message or data.get("status_code") or "").strip()


def sms_error_detail(data: dict) -> str:
    text = _sms_message(data)
    lowered = text.lower()
    if "invalid" in lowered and ("key" in lowered or "auth" in lowered or "token" in lowered):
        return "SMS gateway rejected the API key. Recreate FAST2SMS_API_KEY on Fast2SMS and paste it on Render (no quotes)."
    if any(word in lowered for word in ("balance", "credit", "wallet", "recharge", "insufficient")):
        return "Fast2SMS wallet has no balance. Recharge the Fast2SMS account and try again."
    if "ip" in lowered:
        return "Fast2SMS blocked this server IP. In Fast2SMS Dev API, turn off IP allow-listing (Render IPs change)."
    if any(word in lowered for word in ("dlt", "template", "sender", "otp id", "otp_id")):
        extra = f" Fast2SMS said: {text}." if text else ""
        return (
            "Fast2SMS blocked the SMS until an OTP template is approved."
            " Open Fast2SMS → Smart OTP → Add OTP Template, copy the OTP ID,"
            " then set FAST2SMS_OTP_ID on Render and redeploy."
            f"{extra}"
        )
    if text:
        return f"Could not send the OTP ({text})."
    return "Could not send the OTP. Check Fast2SMS API key, wallet, and IP allow-list on Render."


def _parse_sms_body(response: httpx.Response) -> dict:
    try:
        data = response.json()
        return data if isinstance(data, dict) else {"message": str(data)}
    except Exception:
        text = (response.text or "").strip()[:300]
        return {"message": text} if text else {}


def _sms_ok(response: httpx.Response, data: dict) -> bool:
    if response.status_code >= 400:
        return False
    if data.get("return") is False:
        return False
    status = data.get("status_code")
    if isinstance(status, int) and status >= 400:
        return False
    return True


def _deliver_fast2sms(phone: str, code: str) -> None:
    key = settings.fast2sms_api_key
    otp_id = (settings.fast2sms_otp_id or "").strip()
    headers = {"Authorization": key, "Content-Type": "application/json"}
    last_data: dict = {}
    last_status = None

    def accept(name: str, response: httpx.Response) -> bool:
        nonlocal last_data, last_status
        last_status = response.status_code
        last_data = _parse_sms_body(response)
        if _sms_ok(response, last_data):
            log.info("Fast2SMS accepted via %s to=%s", name, phone)
            return True
        return False

    try:
        if otp_id:
            response = httpx.post(
                FAST2SMS_OTP_URL,
                headers=headers,
                json={
                    "mobile": phone,
                    "otp_id": otp_id,
                    "otp": code,
                    "otp_length": 6,
                    "otp_expiry": 5,
                },
                timeout=20,
            )
            if accept("otp-send", response):
                return
        response = httpx.post(
            FAST2SMS_URL,
            headers=headers,
            json={
                "route": "otp",
                "variables_values": code,
                "numbers": phone,
                "flash": 0,
            },
            timeout=20,
        )
        if accept("bulk-post", response):
            return
        response = httpx.get(
            FAST2SMS_URL,
            params={
                "authorization": key,
                "route": "otp",
                "variables_values": code,
                "numbers": phone,
                "flash": 0,
            },
            timeout=20,
        )
        if accept("bulk-get", response):
            return
        response = httpx.post(
            FAST2SMS_URL,
            headers=headers,
            json={
                "route": "q",
                "message": f"Your AyurSutra OTP is {code}. Valid for 5 minutes. Do not share this code.",
                "language": "english",
                "flash": 0,
                "numbers": phone,
            },
            timeout=20,
        )
        if accept("quick-sms", response):
            return
    except httpx.HTTPError:
        log.exception("Fast2SMS request failed")
        raise HTTPException(
            status_code=503,
            detail="Could not reach Fast2SMS. Wait a moment and try Send OTP again.",
        ) from None

    log.error("Fast2SMS failed status=%s body=%s", last_status, last_data)
    raise HTTPException(status_code=503, detail=sms_error_detail(last_data))


def _deliver(phone: str, code: str) -> None:
    provider = (settings.sms_provider or "fast2sms").strip().lower()
    if provider == "console":
        log.info("OTP (console) to=%s code=%s", phone, code)
        return
    if not settings.fast2sms_api_key:
        raise HTTPException(status_code=503, detail="SMS gateway is not configured. OTP could not be sent.")
    _deliver_fast2sms(phone, code)


def send_otp(db: Session, mobile: str, purpose: str) -> dict:
    phone = canonical_phone(mobile)
    if purpose not in PURPOSES:
        raise HTTPException(status_code=422, detail="Unknown OTP purpose.")
    now = _now()
    cutoff = now - timedelta(hours=1)
    hourly = 0
    for item in (
        db.query(MobileVerification)
        .filter(MobileVerification.mobile == phone, MobileVerification.purpose == purpose)
        .all()
    ):
        if _aware(item.created_at) >= cutoff:
            hourly += 1
    if hourly >= settings.otp_hourly_limit:
        raise HTTPException(status_code=429, detail="Too many OTP requests. Try again later.")
    latest = (
        db.query(MobileVerification)
        .filter(MobileVerification.mobile == phone, MobileVerification.purpose == purpose, MobileVerification.consumed == 0)
        .order_by(MobileVerification.created_at.desc())
        .first()
    )
    if latest and _aware(latest.resend_available_at) > now and latest.verified == 0:
        wait = int((_aware(latest.resend_available_at) - now).total_seconds())
        raise HTTPException(status_code=429, detail=f"Wait {max(wait, 1)} seconds before resending the OTP.")
    code = _generate_otp()
    _deliver(phone, code)
    open_rows = (
        db.query(MobileVerification)
        .filter(
            MobileVerification.mobile == phone,
            MobileVerification.purpose == purpose,
            MobileVerification.consumed == 0,
            MobileVerification.verified == 0,
        )
        .all()
    )
    for row in open_rows:
        row.consumed = 1
    row = MobileVerification(
        id=f"otp-{int(now.timestamp() * 1000)}-{secrets.token_hex(3)}",
        mobile=phone,
        purpose=purpose,
        otp_code=_hash_otp(code),
        expires_at=now + OTP_TTL,
        resend_available_at=now + RESEND_WAIT,
        attempts=0,
        verified=0,
        consumed=0,
    )
    db.add(row)
    db.commit()
    payload = {
        "sent": True,
        "mobile": phone,
        "purpose": purpose,
        "resendAfterSeconds": 30,
        "expiresInSeconds": 300,
    }
    if (settings.sms_provider or "").strip().lower() == "console":
        payload["debugOtp"] = code
    return payload


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
    submitted = (otp or "").strip()
    if not hmac.compare_digest(row.otp_code, _hash_otp(submitted)):
        if row.attempts >= settings.otp_max_attempts:
            row.consumed = 1
            db.commit()
            raise HTTPException(status_code=400, detail="Too many incorrect attempts. Request a new OTP.")
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
