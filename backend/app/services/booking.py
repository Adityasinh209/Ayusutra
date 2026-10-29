from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.entities import Appointment, AuditEvent, PanchakarmaPlan, Therapy
from app.services.continuity import ensure_bill, ensure_followup
from app.services.notify import notify_session_scheduled


INACTIVE = {"Cancelled", "Declined"}


def slot_keys(therapist_id: str, room_id: str, date: str, start: str, status: str):
    if status in INACTIVE:
        return None, None
    return f"{therapist_id}|{date}|{start}", f"{room_id}|{date}|{start}"


def _overlaps(db: Session, date: str, start: str, end: str, therapist_id: str, room_id: str) -> bool:
    rows = db.query(Appointment).filter(Appointment.date == date, Appointment.status.notin_(INACTIVE)).all()
    for a in rows:
        hit = a.therapist_id == therapist_id or a.room_id == room_id
        overlap = (start >= a.start_time and start < a.end_time) or (end > a.start_time and end <= a.end_time)
        if hit and overlap:
            return True
    return False


def _slot_is_past(date: str, start_time: str) -> bool:
    now = datetime.now()
    today = now.strftime("%Y-%m-%d")
    current = now.strftime("%H:%M")
    return date < today or (date == today and start_time <= current)


def book(db: Session, *, actor_id: str, patient_id: str, therapy_id: str, therapist_id: str, room_id: str,
         date: str, start_time: str, end_time: str, treatment_stage: str, plan_id: str | None, session_number: int | None,
         pending: bool = False):
    if _slot_is_past(date, start_time):
        raise HTTPException(status_code=400, detail="Choose a date and time from today onward.")
    if _overlaps(db, date, start_time, end_time, therapist_id, room_id):
        raise HTTPException(status_code=409, detail="That therapist or room is already booked.")
    count = db.query(Appointment).filter(Appointment.patient_id == patient_id).count()
    status = "Pending Confirmation" if pending else "Scheduled"
    t_key, r_key = slot_keys(therapist_id, room_id, date, start_time, status)
    appt = Appointment(
        id=f"appt-{int(datetime.now().timestamp() * 1000)}",
        patient_id=patient_id,
        plan_id=plan_id,
        therapy_id=therapy_id,
        therapist_id=therapist_id,
        room_id=room_id,
        date=date,
        start_time=start_time,
        end_time=end_time,
        treatment_stage=treatment_stage or "Purva Karma",
        session_number=session_number or count + 1,
        status=status,
        created_by=actor_id,
        therapist_slot_key=t_key,
        room_slot_key=r_key,
    )
    db.add(appt)
    db.add(AuditEvent(actor_id=actor_id, action="book", entity="appointment", entity_id=appt.id))
    db.flush()
    if not pending:
        _attach_bill_and_followup(db, appt)
    try:
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="That therapist or room is already booked.") from exc
    db.refresh(appt)
    if not pending:
        notify_session_scheduled(db, appt)
    return appt


def _release(appt: Appointment, status: str, actor_id: str, action: str, db: Session) -> Appointment:
    appt.status = status
    appt.therapist_slot_key = None
    appt.room_slot_key = None
    db.add(AuditEvent(actor_id=actor_id, action=action, entity="appointment", entity_id=appt.id))
    db.commit()
    db.refresh(appt)
    return appt


def cancel(db: Session, appt: Appointment, actor_id: str) -> Appointment:
    return _release(appt, "Cancelled", actor_id, "cancel", db)


def accept(db: Session, appt: Appointment, actor_id: str, *, as_receptionist: bool = False) -> Appointment:
    if appt.status == "Pending Confirmation":
        if not as_receptionist:
            raise HTTPException(status_code=403, detail="Reception must confirm this booking first.")
        appt.status = "Scheduled"
        db.add(AuditEvent(actor_id=actor_id, action="confirm", entity="appointment", entity_id=appt.id))
        _attach_bill_and_followup(db, appt)
        db.commit()
        db.refresh(appt)
        notify_session_scheduled(db, appt)
        return appt
    if appt.status != "Scheduled":
        raise HTTPException(status_code=409, detail="Only a scheduled appointment can be accepted.")
    appt.status = "Confirmed"
    db.add(AuditEvent(actor_id=actor_id, action="accept", entity="appointment", entity_id=appt.id))
    _attach_bill_and_followup(db, appt)
    db.commit()
    db.refresh(appt)
    return appt


def decline(db: Session, appt: Appointment, actor_id: str) -> Appointment:
    if appt.status not in {"Pending Confirmation", "Scheduled", "Confirmed"}:
        raise HTTPException(status_code=409, detail="This appointment can no longer be declined.")
    return _release(appt, "Declined", actor_id, "decline", db)


def _attach_bill_and_followup(db: Session, appt: Appointment) -> None:
    plan = db.get(PanchakarmaPlan, appt.plan_id) if appt.plan_id else None
    therapy = db.get(Therapy, appt.therapy_id) if appt.therapy_id else None
    package = plan.procedure_name if plan and plan.procedure_name else (therapy.name if therapy else "Therapy session")
    sessions = plan.total_sessions if plan and plan.total_sessions else 1
    ensure_bill(db, patient_id=appt.patient_id, appointment=appt, plan=plan, package_type=package, sessions=sessions)
    if plan and plan.follow_up_date:
        ensure_followup(
            db,
            patient_id=appt.patient_id,
            followup_date=plan.follow_up_date,
            plan_id=plan.id,
            therapist_id=appt.therapist_id,
        )


def complete(db: Session, appt: Appointment, actor_id: str, notes: dict) -> Appointment:
    appt.status = "Completed"
    appt.session_notes = notes.get("sessionNotes") or appt.session_notes
    appt.therapist_observations = notes.get("therapistObservations") or appt.therapist_observations
    appt.doctor_remarks = notes.get("doctorRemarks") or appt.doctor_remarks
    appt.completed_at = datetime.now(timezone.utc)
    if appt.plan_id:
        plan = db.get(PanchakarmaPlan, appt.plan_id)
        if plan:
            plan.completed_sessions = (plan.completed_sessions or 0) + 1
            if plan.completed_sessions >= plan.total_sessions:
                plan.treatment_stage = "Paschat Karma"
    db.add(AuditEvent(actor_id=actor_id, action="complete", entity="appointment", entity_id=appt.id))
    db.commit()
    db.refresh(appt)
    return appt
