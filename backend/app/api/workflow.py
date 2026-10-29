"""OTP, staff onboarding, therapist profiles, and previous treatment history."""

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.serialize import row
from app.core.security import get_current_user, require_roles
from app.db.session import get_db
from app.models.entities import (
    PreviousTreatmentHistory, PreviousTreatmentReport, Receptionist, Therapist,
    TherapistAvailability, TherapistTherapy, User,
)
from app.services.otp import consume_verification, send_otp, verify_otp
from app.services.phones import assert_phone_available, canonical_phone
from app.services.uploads import save_report

router = APIRouter()
ADMIN = ("admin",)
STAFF = ("doctor", "therapist", "receptionist", "admin")
WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]


class OtpSendBody(BaseModel):
    mobile: str
    purpose: str


class OtpVerifyBody(BaseModel):
    mobile: str
    purpose: str
    otp: str


class StaffBody(BaseModel):
    fullName: str
    email: str
    mobile: str
    gender: str = ""
    qualification: str = ""
    yearsOfExperience: int = 0
    shift: str = "Morning"
    address: str = ""
    otpVerificationToken: str


class TherapyOffering(BaseModel):
    id: str
    durationMinutes: int = 60


class AvailabilityRow(BaseModel):
    day: str
    working: bool = False
    startTime: str = "09:00"
    endTime: str = "17:00"
    breakStart: str = "13:00"
    breakEnd: str = "14:00"


class TherapistProfileBody(BaseModel):
    therapist: dict
    therapies: list[TherapyOffering] = []
    availability: list[AvailabilityRow] = []


class HistoryBody(BaseModel):
    hospitalName: str
    therapistName: str = ""
    treatmentName: str
    diagnosis: str = ""
    startDate: str = ""
    endDate: str = ""
    medicines: str = ""
    notes: str = ""


def _owns(user: User, patient_id: str) -> bool:
    return user.role != "patient" or user.patient_id == patient_id


def _history_payload(db: Session, record: PreviousTreatmentHistory) -> dict:
    data = row(record, [
        "id", "patient_id", "hospital_name", "therapist_name", "treatment_name", "diagnosis",
        "start_date", "end_date", "medicines", "notes", "created_at",
    ])
    reports = db.query(PreviousTreatmentReport).filter(PreviousTreatmentReport.history_id == record.id).all()
    data["reports"] = [
        {
            "id": report.id,
            "fileName": report.file_name,
            "contentType": report.content_type,
            "reportUrl": f"/uploads/reports/{report.stored_name}",
        }
        for report in reports
    ]
    return data


def _profile_payload(db: Session, therapist: Therapist) -> dict:
    availability = db.query(TherapistAvailability).filter(TherapistAvailability.therapist_id == therapist.id).all()
    therapies = db.query(TherapistTherapy).filter(TherapistTherapy.therapist_id == therapist.id).all()
    data = row(therapist, [
        "id", "user_id", "name", "specializations", "therapy_ids", "qualification", "experience",
        "shift_start", "shift_end", "availability_status", "active", "gender", "phone", "email",
        "registration_number", "languages", "about_me", "photo_name", "max_patients_per_day",
        "max_sessions_per_day", "accept_male", "accept_female", "accept_children", "accept_seniors",
    ])
    data["availability"] = [row(item, ["day", "working", "start_time", "end_time", "break_start", "break_end"]) for item in availability]
    data["therapies"] = [{"id": item.therapy_id, "durationMinutes": item.duration_mins} for item in therapies]
    data["languages"] = [part for part in (therapist.languages or "").split(",") if part]
    return data


def _save_profile(db: Session, therapist: Therapist, body: TherapistProfileBody) -> dict:
    info = body.therapist or {}
    therapist.name = (info.get("fullName") or therapist.name or "").strip()
    therapist.gender = info.get("gender") or therapist.gender or ""
    if info.get("mobile"):
        therapist.phone = assert_phone_available(db, info["mobile"], ignore_therapist_id=therapist.id, ignore_user_id=therapist.user_id)
        if therapist.user_id:
            owner = db.get(User, therapist.user_id)
            if owner:
                owner.phone = therapist.phone
    therapist.email = info.get("email") or therapist.email or ""
    therapist.qualification = info.get("qualification") or ""
    therapist.registration_number = info.get("registrationNumber") or ""
    therapist.experience = int(info.get("yearsOfExperience") or 0)
    therapist.specializations = info.get("specialization") or ""
    languages = info.get("languages") or []
    therapist.languages = ",".join(languages) if isinstance(languages, list) else str(languages)
    therapist.about_me = info.get("aboutMe") or ""
    therapist.photo_name = info.get("photoName") or therapist.photo_name or ""
    therapist.max_patients_per_day = int(info.get("maxPatientsPerDay") or 10)
    therapist.max_sessions_per_day = int(info.get("maxSessionsPerDay") or 8)
    therapist.availability_status = info.get("status") or "Available"
    prefs = info.get("preferences") or {}
    therapist.accept_male = 1 if prefs.get("acceptMalePatients", True) else 0
    therapist.accept_female = 1 if prefs.get("acceptFemalePatients", True) else 0
    therapist.accept_children = 1 if prefs.get("acceptChildren") else 0
    therapist.accept_seniors = 1 if prefs.get("acceptSeniorCitizens", True) else 0
    therapist.therapy_ids = ",".join(item.id for item in body.therapies)
    db.query(TherapistTherapy).filter(TherapistTherapy.therapist_id == therapist.id).delete()
    db.query(TherapistAvailability).filter(TherapistAvailability.therapist_id == therapist.id).delete()
    for item in body.therapies:
        db.add(TherapistTherapy(
            id=f"{therapist.id}-{item.id}"[:64],
            therapist_id=therapist.id,
            therapy_id=item.id,
            duration_mins=item.durationMinutes or 60,
        ))
    working = [row for row in body.availability if row.working]
    if working:
        therapist.shift_start = working[0].startTime
        therapist.shift_end = working[0].endTime
    for row in body.availability:
        db.add(TherapistAvailability(
            id=f"{therapist.id}-{row.day}"[:64],
            therapist_id=therapist.id,
            day=row.day,
            working=1 if row.working else 0,
            start_time=row.startTime,
            end_time=row.endTime,
            break_start=row.breakStart,
            break_end=row.breakEnd,
        ))
    db.commit()
    db.refresh(therapist)
    return _profile_payload(db, therapist)


@router.post("/send-otp")
@router.post("/api/send-otp")
def send_code(body: OtpSendBody, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    phone = canonical_phone(body.mobile)
    if body.purpose in {"therapist_register", "receptionist_register"} and user.role != "admin":
        raise HTTPException(403, "Only an administrator can verify staff registrations.")
    if body.purpose == "patient_register" and user.role not in STAFF:
        raise HTTPException(403, "Not allowed.")
    ignore_patient = user.patient_id if body.purpose == "patient_intake" else None
    ignore_user = user.id if body.purpose == "patient_intake" else None
    assert_phone_available(db, phone, ignore_patient_id=ignore_patient, ignore_user_id=ignore_user)
    return send_otp(db, phone, body.purpose)


@router.post("/verify-otp")
@router.post("/api/verify-otp")
def verify_code(body: OtpVerifyBody, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if body.purpose in {"therapist_register", "receptionist_register"} and user.role != "admin":
        raise HTTPException(403, "Not allowed.")
    if body.purpose == "patient_register" and user.role not in STAFF:
        raise HTTPException(403, "Not allowed.")
    return verify_otp(db, body.mobile, body.purpose, body.otp)


@router.post("/api/staff", status_code=201)
def register_staff(body: StaffBody, role: str, user: User = Depends(require_roles(*ADMIN)), db: Session = Depends(get_db)):
    if role not in {"therapist", "receptionist"}:
        raise HTTPException(422, "Role must be therapist or receptionist.")
    phone = assert_phone_available(db, body.mobile)
    consume_verification(db, body.otpVerificationToken, phone, f"{role}_register")
    email = body.email.strip().lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(409, "A user with this email already exists.")
    stamp = int(datetime.now(timezone.utc).timestamp() * 1000)
    account = User(
        id=f"user-{stamp}",
        email=email,
        name=body.fullName.strip(),
        role=role,
        role_label="Therapist" if role == "therapist" else "Receptionist",
        phone=phone,
        active=1,
    )
    db.add(account)
    db.flush()
    if role == "therapist":
        profile = Therapist(
            id=f"therapist-{stamp}",
            user_id=account.id,
            name=body.fullName.strip(),
            gender=body.gender,
            phone=phone,
            email=email,
            qualification=body.qualification,
            experience=body.yearsOfExperience,
            active=1,
        )
        db.add(profile)
        account.therapist_id = profile.id
        for index, day in enumerate(WEEKDAYS):
            db.add(TherapistAvailability(
                id=f"avail-{stamp}-{index}",
                therapist_id=profile.id,
                day=day,
                working=0 if day == "sunday" else 1,
            ))
    else:
        db.add(Receptionist(
            id=f"receptionist-{stamp}",
            user_id=account.id,
            shift=body.shift,
            address=body.address,
        ))
    db.commit()
    db.refresh(account)
    return row(account, ["id", "name", "email", "role", "role_label", "phone", "therapist_id"])


@router.get("/api/therapists/me")
def my_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not user.therapist_id:
        raise HTTPException(404, "Therapist profile not found.")
    therapist = db.get(Therapist, user.therapist_id)
    if therapist is None:
        raise HTTPException(404, "Therapist profile not found.")
    return _profile_payload(db, therapist)


@router.put("/api/therapists/me")
def save_my_profile(body: TherapistProfileBody, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in ("therapist", "admin", "doctor") or (user.role == "therapist" and not user.therapist_id):
        raise HTTPException(403, "Not allowed.")
    therapist = db.get(Therapist, user.therapist_id) if user.therapist_id else None
    if therapist is None:
        raise HTTPException(404, "Therapist profile not found.")
    return _save_profile(db, therapist, body)


@router.get("/api/patients/{patient_id}/history")
def list_history(patient_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not _owns(user, patient_id):
        raise HTTPException(403, "Not allowed.")
    rows = (
        db.query(PreviousTreatmentHistory)
        .filter(PreviousTreatmentHistory.patient_id == patient_id)
        .order_by(PreviousTreatmentHistory.start_date.desc(), PreviousTreatmentHistory.created_at.desc())
        .all()
    )
    return [_history_payload(db, row) for row in rows]


@router.post("/api/patients/{patient_id}/history", status_code=201)
def create_history(patient_id: str, body: HistoryBody, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not _owns(user, patient_id):
        raise HTTPException(403, "Not allowed.")
    if not body.hospitalName.strip() or not body.treatmentName.strip():
        raise HTTPException(422, "Hospital and treatment name are required.")
    record = PreviousTreatmentHistory(
        id=f"history-{int(datetime.now().timestamp() * 1000)}",
        patient_id=patient_id,
        hospital_name=body.hospitalName.strip(),
        therapist_name=body.therapistName.strip(),
        treatment_name=body.treatmentName.strip(),
        diagnosis=body.diagnosis.strip(),
        start_date=body.startDate,
        end_date=body.endDate,
        medicines=body.medicines.strip(),
        notes=body.notes.strip(),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return _history_payload(db, record)


@router.post("/api/patients/{patient_id}/history/{history_id}/reports", status_code=201)
def upload_report(
    patient_id: str,
    history_id: str,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not _owns(user, patient_id):
        raise HTTPException(403, "Not allowed.")
    record = db.get(PreviousTreatmentHistory, history_id)
    if record is None or record.patient_id != patient_id:
        raise HTTPException(404, "Treatment history not found.")
    file_name, content_type, stored = save_report(history_id, file)
    report = PreviousTreatmentReport(
        id=f"report-{int(datetime.now().timestamp() * 1000)}",
        history_id=history_id,
        file_name=file_name,
        content_type=content_type,
        stored_name=stored,
    )
    db.add(report)
    db.commit()
    return _history_payload(db, record)
