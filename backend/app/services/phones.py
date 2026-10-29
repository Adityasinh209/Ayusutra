"""Canonical 10-digit mobiles and cross-role uniqueness."""

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.entities import Patient, Therapist, User


def canonical_phone(raw: str) -> str:
    digits = "".join(ch for ch in (raw or "") if ch.isdigit())
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    if len(digits) != 10:
        raise HTTPException(status_code=422, detail="Mobile number must contain exactly 10 digits.")
    return digits


def assert_phone_available(
    db: Session,
    phone: str,
    *,
    ignore_patient_id: str | None = None,
    ignore_user_id: str | None = None,
    ignore_therapist_id: str | None = None,
) -> str:
    mobile = canonical_phone(phone)
    patient = db.query(Patient).filter(Patient.phone == mobile).one_or_none()
    if patient and patient.id != ignore_patient_id:
        raise HTTPException(status_code=409, detail="This mobile number is already registered.")
    user = db.query(User).filter(User.phone == mobile).one_or_none()
    if user and user.id != ignore_user_id:
        raise HTTPException(status_code=409, detail="This mobile number is already registered.")
    therapist = db.query(Therapist).filter(Therapist.phone == mobile).one_or_none()
    if therapist and therapist.id != ignore_therapist_id:
        raise HTTPException(status_code=409, detail="This mobile number is already registered.")
    return mobile
