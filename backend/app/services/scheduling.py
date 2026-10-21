"""Deterministic slot search. Does not invent therapists, rooms, or times."""

from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.entities import Appointment, Patient, Therapist, TherapistLeave, Therapy, TherapyRoom


def _qualified(therapist: Therapist, therapy: Therapy) -> bool:
    specs = [s for s in (therapist.specializations or "").split(",") if s]
    ids = [s for s in (therapist.therapy_ids or "").split(",") if s]
    return (
        therapist.specialization == therapy.name
        or therapist.specialization == therapy.required_therapist_specialization
        or therapy.name in specs
        or therapy.required_therapist_specialization in specs
        or therapy.id in ids
    )


def _room_ok(room: TherapyRoom, therapy: Therapy) -> bool:
    return room.room_type == therapy.required_room_type


def _on_leave(leaves: list[TherapistLeave], date: str) -> bool:
    return any(l.start_date <= date <= l.end_date for l in leaves)


def _overlap(a_start: str, a_end: str, b_start: str, b_end: str) -> bool:
    return (a_start >= b_start and a_start < b_end) or (a_end > b_start and a_end <= b_end)


def _add_minutes(hhmm: str, mins: int) -> str:
    h, m = map(int, hhmm.split(":"))
    total = h * 60 + m + mins
    return f"{total // 60:02d}:{total % 60:02d}"


def recommend_slots(db: Session, patient_id: str, therapy_id: str, preferred_date: str = "", preferred_time: str = "") -> list[dict]:
    therapy = db.get(Therapy, therapy_id)
    if therapy is None or not therapy.active:
        return []
    patient = db.get(Patient, patient_id)
    therapists = [t for t in db.query(Therapist).filter(Therapist.active == 1) if _qualified(t, therapy)]
    rooms = [r for r in db.query(TherapyRoom).filter(TherapyRoom.active == 1) if _room_ok(r, therapy)]
    appts = db.query(Appointment).all()
    now = datetime.now()
    today = now.strftime("%Y-%m-%d")
    current = now.strftime("%H:%M")
    morning = ["08:00", "09:30", "11:00"]
    afternoon = ["13:00", "14:30", "16:00", "17:30"]
    if preferred_time == "morning":
        base = morning
    elif preferred_time == "afternoon":
        base = afternoon
    else:
        base = ["08:30", "10:00", "11:30", "14:00", "15:30", "17:00"]

    target = preferred_date
    if not target:
        remaining = [t for t in base if t > current]
        target = today if remaining else (now + timedelta(days=1)).strftime("%Y-%m-%d")

    def collect(date: str, times: list[str]) -> list[dict]:
        found = []
        for start in times:
            if date == today and start <= current:
                continue
            end = _add_minutes(start, therapy.default_duration_mins or 60)
            for therapist in therapists:
                leaves = db.query(TherapistLeave).filter(TherapistLeave.therapist_id == therapist.id).all()
                if _on_leave(leaves, date):
                    continue
                for room in rooms:
                    conflict = any(
                        a.date == date and a.status != "Cancelled"
                        and (a.room_id == room.id or a.therapist_id == therapist.id)
                        and _overlap(start, end, a.start_time, a.end_time)
                        for a in appts
                    )
                    if conflict:
                        continue
                    found.append({
                        "id": f"slot-{therapist.id}-{room.id}-{start.replace(':', '')}",
                        "therapistId": therapist.id,
                        "roomId": room.id,
                        "date": date,
                        "startTime": start,
                        "endTime": end,
                        "therapistWorkload": sum(1 for a in appts if a.date == date and a.therapist_id == therapist.id),
                        "treatmentStage": therapy.stage or "Purva Karma",
                        "recommended": len(found) == 0,
                        "reason": f"{therapist.name} is qualified for {therapy.name}. Room {room.name} matches {therapy.required_room_type}.",
                        "therapist": {"id": therapist.id, "name": therapist.name, "specialization": therapist.specialization},
                        "room": {"id": room.id, "name": room.name, "roomType": room.room_type},
                        "therapy": {"id": therapy.id, "name": therapy.name},
                        "isValid": True,
                    })
                    if len(found) >= 4:
                        return found
                if len(found) >= 4:
                    return found
            if len(found) >= 4:
                return found
        return found

    times = [t for t in base if not (target == today and t <= current)]
    slots = collect(target, times)
    if not slots and not preferred_date:
        nxt = (now + timedelta(days=1)).strftime("%Y-%m-%d")
        slots = collect(nxt, base)
    if patient is None:
        return slots
    return slots
