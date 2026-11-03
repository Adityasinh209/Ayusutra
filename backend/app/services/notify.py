import logging
import smtplib
from email.message import EmailMessage

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.entities import Appointment, EmrRecord, FollowUp, PanchakarmaPlan, Patient, Therapist, Therapy, User

log = logging.getLogger("ayursutra.notify")


def _send(to: str, subject: str, body: str, html: str | None = None) -> dict:
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
    if html:
        message.add_alternative(html, subtype="html")
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


def notify_therapy_assigned(
    db: Session,
    patient: Patient,
    therapy: Therapy | None,
    assigner: User,
    plan: PanchakarmaPlan | None,
    emr: EmrRecord | None = None,
) -> dict:
    if patient is None:
        return {"sent": False, "reason": "missing-patient"}
    therapy_name = (therapy.name if therapy else None) or (plan.procedure_name if plan else None) or "Panchakarma therapy"
    therapist_name = assigner.name if assigner else "your therapist"
    patient_name = patient.full_name or "Patient"
    instructions = ""
    if plan and plan.doctor_instructions:
        instructions = plan.doctor_instructions
    elif emr and (emr.doctor_notes or emr.treatment_plan):
        instructions = emr.doctor_notes or emr.treatment_plan
    diet = (plan.diet_plan if plan else "") or (emr.dietary_instructions if emr else "") or ""
    origin = (settings.frontend_url or "http://localhost:5173").rstrip("/")
    params = []
    if therapy and therapy.id:
        params.append(f"therapyId={therapy.id}")
    if plan and plan.id:
        params.append(f"planId={plan.id}")
    book_url = f"{origin}/scheduling" + (f"?{'&'.join(params)}" if params else "")
    details = instructions or diet or "Please follow the prescribed Panchakarma protocol."
    subject = f"Therapy assigned: {therapy_name}"
    body = (
        f"Namaste {patient_name},\n\n"
        f"{therapist_name} has assigned {therapy_name} to your treatment plan.\n\n"
        f"Instructions: {details}\n\n"
        f"Book your session: {book_url}\n\n"
        "AyurSutra Panchakarma Center"
    )
    html = (
        f"<p>Namaste {patient_name},</p>"
        f"<p><strong>{therapist_name}</strong> has assigned <strong>{therapy_name}</strong> to your treatment plan.</p>"
        f"<p>{details}</p>"
        f'<p><a href="{book_url}" style="display:inline-block;padding:10px 16px;background:#166534;color:#fff;'
        f'text-decoration:none;border-radius:8px;">Book your session</a></p>'
        f"<p>AyurSutra Panchakarma Center</p>"
    )
    to = (patient.email or "").strip()
    if not to:
        linked = db.query(User).filter(User.patient_id == patient.id).first()
        to = ((linked.email if linked else "") or "").strip()
    try:
        return _send(to, subject, body, html=html)
    except Exception:
        log.exception("Assignment email failed for patient=%s", patient.id)
        return {"to": to, "sent": False, "reason": "send-failed"}


def notify_followup_reminder(db: Session, followup: FollowUp) -> dict:
    if followup is None:
        return {"sent": False, "reason": "missing-followup"}
    patient = db.get(Patient, followup.patient_id)
    therapist = db.get(Therapist, followup.therapist_id) if followup.therapist_id else None
    therapist_user = (
        db.query(User).filter(User.therapist_id == followup.therapist_id).first()
        if followup.therapist_id
        else None
    )
    plan = db.get(PanchakarmaPlan, followup.plan_id) if followup.plan_id else None
    patient_name = (patient.full_name if patient else "") or "Patient"
    therapist_name = (
        (therapist.name if therapist else "")
        or (therapist_user.name if therapist_user else "")
        or "your therapist"
    )
    followup_date = followup.followup_date or "the scheduled date"
    details = (plan.procedure_name if plan else "") or (plan.primary_panchakarma if plan else "") or "post-procedure review"
    instructions = (
        (plan.doctor_instructions if plan and plan.doctor_instructions else "")
        or "Please attend during clinic consultation hours. Arrive a few minutes early and bring any recent reports."
    )
    to = ((patient.email if patient else "") or "").strip()
    if not to and patient:
        linked = db.query(User).filter(User.patient_id == patient.id).first()
        to = ((linked.email if linked else "") or "").strip()
    if not to:
        return {"to": to, "sent": False, "reason": "missing-address"}
    if not settings.smtp_host:
        return {"to": to, "sent": False, "reason": "smtp-not-configured"}
    subject = f"Follow-up reminder: {followup_date}"
    body = (
        f"Namaste {patient_name},\n\n"
        f"This is a reminder for your scheduled follow-up.\n\n"
        f"Patient: {patient_name}\n"
        f"Follow-up date: {followup_date}\n"
        f"Time: clinic consultation hours\n"
        f"Therapist: {therapist_name}\n"
        f"Details: {details} ({followup.status or 'Pending'})\n"
        f"Instructions: {instructions}\n\n"
        "AyurSutra Panchakarma Center"
    )
    try:
        return _send(to, subject, body)
    except Exception as exc:
        log.exception("Follow-up reminder failed for followup=%s", followup.id)
        return {"to": to, "sent": False, "reason": str(exc) or "send-failed"}
