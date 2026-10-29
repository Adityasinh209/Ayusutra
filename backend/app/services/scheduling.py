"""Deterministic slot search. Does not invent therapists, rooms, or times."""

from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.entities import (
    Appointment, Patient, Therapist, TherapistAvailability, TherapistLeave, TherapistTherapy, Therapy, TherapyRoom,
)

INACTIVE = {"Cancelled", "Declined"}
WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]


def _qualified(therapist: Therapist, therapy: Therapy) -> bool:
    specs = [s for s in (therapist.specializations or "").split(",") if s]
    ids = [s for s in (therapist.therapy_ids or "").split(",") if s]
    return (
        therapy.name in specs
        or therapy.required_therapist_specialization in specs
        or therapy.id in ids
    )


def _room_ok(room: TherapyRoom, therapy: Therapy) -> bool:
    return room.room_type == therapy.required_room_type


def _on_leave(leaves: list[TherapistLeave], date: str) -> bool:
    return any(l.start_date <= date <= l.end_date for l in leaves)


def _overlap(a_start: str, a_end: str, b_start: str, b_end: str) -> bool:
    return (a_start >= b_start and a_start < b_end) or (a_end > b_start and a_end <= b_end)


def _minutes(hhmm: str) -> int:
    h, m = map(int, hhmm.split(":"))
    return h * 60 + m


def _fits_window(start: str, end: str, window_start: str, window_end: str) -> bool:
    return _minutes(start) >= _minutes(window_start) and _minutes(end) <= _minutes(window_end)


def _hits_break(start: str, end: str, break_start: str, break_end: str) -> bool:
    if not break_start or not break_end or break_start >= break_end:
        return False
    return _overlap(start, end, break_start, break_end)


def _day_rule(db: Session, therapist: Therapist, date: str) -> TherapistAvailability | None:
    rows = db.query(TherapistAvailability).filter(TherapistAvailability.therapist_id == therapist.id).all()
    if not rows:
        return None
    weekday = WEEKDAYS[datetime.strptime(date, "%Y-%m-%d").weekday()]
    return next((row for row in rows if row.day == weekday), None)


def _duration_for(db: Session, therapist: Therapist, therapy: Therapy) -> int:
    offering = (
        db.query(TherapistTherapy)
        .filter(TherapistTherapy.therapist_id == therapist.id, TherapistTherapy.therapy_id == therapy.id)
        .one_or_none()
    )
    return offering.duration_mins if offering and offering.duration_mins else (therapy.default_duration_mins or 60)


def _add_minutes(hhmm: str, mins: int) -> str:
    h, m = map(int, hhmm.split(":"))
    total = h * 60 + m + mins
    return f"{total // 60:02d}:{total % 60:02d}"


def recommend_slots(db: Session, patient_id: str, therapy_id: str, preferred_date: str = "", preferred_time: str = "") -> list[dict]:
    therapy = db.get(Therapy, therapy_id)
    if therapy is None or not therapy.active:
        return []
    patient = db.get(Patient, patient_id)
    therapists = [
        t for t in db.query(Therapist).filter(Therapist.active == 1)
        if _qualified(t, therapy) and (t.availability_status or "Available") == "Available"
    ]
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
    if target and target < today:
        return []
    if not target:
        remaining = [t for t in base if t > current]
        target = today if remaining else (now + timedelta(days=1)).strftime("%Y-%m-%d")

    def collect(date: str, times: list[str]) -> list[dict]:
        found = []
        for start in times:
            if date == today and start <= current:
                continue
            for therapist in therapists:
                leaves = db.query(TherapistLeave).filter(TherapistLeave.therapist_id == therapist.id).all()
                if _on_leave(leaves, date):
                    continue
                rule = _day_rule(db, therapist, date)
                if rule is not None and not rule.working:
                    continue
                end = _add_minutes(start, _duration_for(db, therapist, therapy))
                window_start = rule.start_time if rule else (therapist.shift_start or "09:00")
                window_end = rule.end_time if rule else (therapist.shift_end or "17:00")
                if not _fits_window(start, end, window_start, window_end):
                    continue
                if rule and _hits_break(start, end, rule.break_start, rule.break_end):
                    continue
                day_load = sum(
                    1 for a in appts
                    if a.date == date and a.therapist_id == therapist.id and a.status not in INACTIVE
                )
                if day_load >= (therapist.max_sessions_per_day or 8):
                    continue
                for room in rooms:
                    conflict = any(
                        a.date == date and a.status not in INACTIVE
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
                        "therapistWorkload": day_load,
                        "treatmentStage": therapy.stage or "Purva Karma",
                        "recommended": len(found) == 0,
                        "reason": f"{therapist.name} is qualified for {therapy.name}. Room {room.name} matches {therapy.required_room_type}.",
                        "therapist": {"id": therapist.id, "name": therapist.name, "specializations": therapist.specializations},
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
