import logging
import smtplib
from email.message import EmailMessage

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.entities import Appointment, Patient, Therapist, Therapy, User

log = logging.getLogger("ayursutra.notify")


def _send(to: str, subject: str, body: str) -> dict:
    if not to:
        return {"to": to, "sent": False, "reason": "missing-address"}
    if not settings.smtp_host:
        log.info("Email (logged) to=%s subject=%s\n%s", to, subject, body)
        return {"to": to, "sent": False, "logged": True}
    message = EmailMessage()
    message["From"] = settings.mail_from
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
        smtp.starttls()
        if settings.smtp_user:
            smtp.login(settings.smtp_user, settings.smtp_password)
        smtp.send_message(message)
    return {"to": to, "sent": True}


def notify_session_scheduled(db: Session, appt: Appointment) -> list[dict]:
    patient = db.get(Patient, appt.patient_id)
    therapist = db.get(Therapist, appt.therapist_id)
    therapy = db.get(Therapy, appt.therapy_id)
    therapist_user = (
        db.query(User).filter(User.therapist_id == appt.therapist_id).first()
        if appt.therapist_id
        else None
    )
    procedure = therapy.name if therapy else "Panchakarma session"
    when = f"{appt.date} at {appt.start_time}–{appt.end_time}"
    therapist_name = therapist.name if therapist else "the assigned therapist"
    patient_name = patient.full_name if patient else "Patient"
    subject = f"Session scheduled: {procedure}"
    patient_body = (
        f"Namaste {patient_name},\n\n"
        f"Your {procedure} session is confirmed for {when} with {therapist_name}.\n\n"
        "AyurSutra Panchakarma Center"
    )
    therapist_body = (
        f"Namaste {therapist_name},\n\n"
        f"A session is scheduled with {patient_name} for {procedure} on {when}.\n\n"
        "AyurSutra Panchakarma Center"
    )
    patient_email = (patient.email if patient else "") or ""
    therapist_email = (therapist.email if therapist else "") or (therapist_user.email if therapist_user else "")
    return [
        _send(patient_email, subject, patient_body),
        _send(therapist_email, subject, therapist_body),
    ]
