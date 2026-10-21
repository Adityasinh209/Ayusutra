from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.entities import Appointment, AuditEvent, PanchakarmaPlan


def slot_keys(therapist_id: str, room_id: str, date: str, start: str, status: str):
    if status == "Cancelled":
        return None, None
    return f"{therapist_id}|{date}|{start}", f"{room_id}|{date}|{start}"


def _overlaps(db: Session, date: str, start: str, end: str, therapist_id: str, room_id: str) -> bool:
    rows = db.query(Appointment).filter(Appointment.date == date, Appointment.status != "Cancelled").all()
    for a in rows:
        hit = a.therapist_id == therapist_id or a.room_id == room_id
        overlap = (start >= a.start_time and start < a.end_time) or (end > a.start_time and end <= a.end_time)
        if hit and overlap:
            return True
    return False


def book(db: Session, *, actor_id: str, patient_id: str, therapy_id: str, therapist_id: str, room_id: str,
         date: str, start_time: str, end_time: str, treatment_stage: str, plan_id: str | None, session_number: int | None):
    if _overlaps(db, date, start_time, end_time, therapist_id, room_id):
        raise HTTPException(status_code=409, detail="That therapist or room is already booked.")
    count = db.query(Appointment).filter(Appointment.patient_id == patient_id).count()
    t_key, r_key = slot_keys(therapist_id, room_id, date, start_time, "Scheduled")
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
        status="Scheduled",
        created_by=actor_id,
        therapist_slot_key=t_key,
        room_slot_key=r_key,
    )
    db.add(appt)
    db.add(AuditEvent(actor_id=actor_id, action="book", entity="appointment", entity_id=appt.id))
    try:
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="That therapist or room is already booked.") from exc
    db.refresh(appt)
    return appt


def cancel(db: Session, appt: Appointment, actor_id: str) -> Appointment:
    appt.status = "Cancelled"
    appt.therapist_slot_key = None
    appt.room_slot_key = None
    db.add(AuditEvent(actor_id=actor_id, action="cancel", entity="appointment", entity_id=appt.id))
    db.commit()
    db.refresh(appt)
    return appt


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
