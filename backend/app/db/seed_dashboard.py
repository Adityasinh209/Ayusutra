"""Demo rows for dashboard stats (15 patients, plans, today's sessions). Idempotent."""

from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.entities import (
    Appointment,
    BillingRecord,
    FollowUp,
    PanchakarmaPlan,
    Patient,
    TherapyRoom,
)
from app.services.booking import slot_keys

MARKER_PATIENT_ID = "patient-15"

_DEMO_PATIENTS = [
    ("patient-2", "Anjali Desai", "9812345678", "anjali.desai@email.com", "Female", "B+", "Pitta-Vata"),
    ("patient-3", "Suresh Pillai", "9900112233", "suresh.pillai@email.com", "Male", "O+", "Kapha-Vata"),
    ("patient-4", "Sunidhi Rao", "9822334455", "sunidhi.rao@email.com", "Female", "A+", "Kapha-Pitta"),
    ("patient-5", "Vikram Mehta", "9123456780", "vikram.mehta@email.com", "Male", "AB+", "Vata"),
    ("patient-6", "Priya Nambiar", "9234567891", "priya.nambiar@email.com", "Female", "B-", "Pitta"),
    ("patient-7", "Arjun Kulkarni", "9345678902", "arjun.kulkarni@email.com", "Male", "A-", "Vata-Kapha"),
    ("patient-8", "Meera Iyer", "9456789013", "meera.iyer@email.com", "Female", "O-", "Pitta-Kapha"),
    ("patient-9", "Rohan Gupta", "9567890124", "rohan.gupta@email.com", "Male", "B+", "Vata-Pitta"),
    ("patient-10", "Kavita Singh", "9678901235", "kavita.singh@email.com", "Female", "A+", "Kapha"),
    ("patient-11", "Deepak Patil", "9789012346", "deepak.patil@email.com", "Male", "O+", "Vata"),
    ("patient-12", "Neha Reddy", "9890123457", "neha.reddy@email.com", "Female", "AB-", "Pitta-Vata"),
    ("patient-13", "Sanjay Verma", "9901234568", "sanjay.verma@email.com", "Male", "B+", "Kapha-Pitta"),
    ("patient-14", "Lakshmi Menon", "9012345679", "lakshmi.menon@email.com", "Female", "A+", "Vata"),
    ("patient-15", "Harish Bhatt", "9123456789", "harish.bhatt@email.com", "Male", "O+", "Pitta-Kapha"),
]

_PROCEDURES = [
    ("Yoga Basti Krama", "Basti", "Pradhana Karma"),
    ("Shirodhara De-Stress Protocol", "Shirodhara", "Purva Karma"),
    ("Janu Basti Rejuvenation", "Basti", "Paschat Karma"),
    ("Marsha Nasya Intensive", "Nasya", "Purva Karma"),
    ("Abhyanga & Swedana Course", "Abhyanga", "Purva Karma"),
]


def seed_dashboard_demo(db: Session) -> None:
    if db.get(Patient, MARKER_PATIENT_ID):
        _ensure_today_appointments(db)
        return

    if not db.get(TherapyRoom, "room-2"):
        db.add(TherapyRoom(id="room-2", name="Abhyanga Shala 2", room_type="Abhyanga Room", active=1))

    for pid, name, phone, email, gender, blood, prakriti in _DEMO_PATIENTS:
        db.add(Patient(
            id=pid,
            full_name=name,
            phone=phone,
            email=email,
            gender=gender,
            blood_group=blood,
            prakriti=prakriti,
            address=f"Demo address, {name.split()[-1]} locality",
            emergency_contact=f"Family - {phone[:6]}0000",
            registered_by="user-2",
        ))
    db.flush()

    today = datetime.now(timezone.utc).date()
    today_iso = today.isoformat()
    follow_base = (today + timedelta(days=14)).isoformat()

    patient_ids = ["patient-1"] + [p[0] for p in _DEMO_PATIENTS]

    for i, pid in enumerate(patient_ids):
        proc = _PROCEDURES[i % len(_PROCEDURES)]
        therapist_id = "therapist-1" if i % 2 == 0 else "therapist-2"
        room_id = "room-1" if i % 2 == 0 else "room-3"
        plan_id = f"plan-{i + 1}"
        db.add(PanchakarmaPlan(
            id=plan_id,
            patient_id=pid,
            doctor_id="user-1",
            procedure_name=proc[0],
            primary_panchakarma=proc[1],
            treatment_stage=proc[2],
            total_sessions=10,
            completed_sessions=min(i + 2, 9),
            start_date=(today - timedelta(days=7)).isoformat(),
            end_date=(today + timedelta(days=21)).isoformat(),
            assigned_therapist_id=therapist_id,
            assigned_room_id=room_id,
            status="In Progress",
            doctor_instructions=f"Continue {proc[0]} as per Vaidya protocol.",
            diet_plan="Pathya diet — warm, light, no cold or fermented foods.",
            follow_up_date=follow_base,
        ))

        if not db.get(BillingRecord, f"bill-demo-{i + 1}"):
            total = Decimal(12000 + (i * 850))
            db.add(BillingRecord(
                id=f"bill-demo-{i + 1}",
                patient_id=pid,
                plan_id=plan_id,
                invoice_number=f"INV-DEMO-{str(i + 1).zfill(3)}",
                package_type=proc[0],
                items_json='[{"description":"Therapy package","amount":12000}]',
                subtotal=total,
                discount=Decimal("0"),
                tax_amount=total * Decimal("0.05"),
                total_amount=total * Decimal("1.05"),
                paid_amount=total * Decimal("1.05") if i % 3 != 2 else Decimal("5000"),
                payment_status="Paid" if i % 3 != 2 else "Partial",
                payment_method="UPI / Digital",
                bill_date=(today - timedelta(days=i % 5)).isoformat(),
            ))

        if not db.get(FollowUp, f"followup-demo-{i + 1}"):
            db.add(FollowUp(
                id=f"followup-demo-{i + 1}",
                patient_id=pid,
                therapist_id=therapist_id,
                plan_id=plan_id,
                followup_date=follow_base,
                reminder_sent=1 if i % 4 == 0 else 0,
                status="Pending" if i % 5 else "Completed",
            ))

    db.flush()
    _seed_today_appointments(db, today_iso, patient_ids)
    db.flush()
    db.commit()


def _ensure_today_appointments(db: Session) -> None:
    """If demo patients exist but today's queue is empty, add today's sessions."""
    today_iso = datetime.now(timezone.utc).date().isoformat()
    count = db.query(Appointment).filter(Appointment.date == today_iso, Appointment.id.like("appt-demo-%")).count()
    if count >= 10:
        return
    patient_ids = [
        p.id for p in db.query(Patient).filter(Patient.id.like("patient-%")).order_by(Patient.id).limit(15).all()
    ]
    if len(patient_ids) < 5:
        return
    db.query(Appointment).filter(Appointment.id.like("appt-demo-%"), Appointment.date == today_iso).delete(
        synchronize_session=False,
    )
    _seed_today_appointments(db, today_iso, patient_ids)
    db.commit()


def _seed_today_appointments(db: Session, today_iso: str, patient_ids: list[str]) -> None:
    """Up to 15 non-overlapping sessions today for dashboard widgets."""
    slots = [
        ("09:00", "10:00", "therapy-1", "therapist-1", "room-1", "Purva Karma"),
        ("09:00", "10:00", "therapy-2", "therapist-2", "room-3", "Purva Karma"),
        ("10:00", "11:00", "therapy-1", "therapist-2", "room-3", "Pradhana Karma"),
        ("10:00", "11:00", "therapy-2", "therapist-1", "room-1", "Purva Karma"),
        ("11:00", "12:00", "therapy-1", "therapist-1", "room-1", "Pradhana Karma"),
        ("11:00", "12:00", "therapy-2", "therapist-2", "room-3", "Purva Karma"),
        ("12:00", "13:00", "therapy-1", "therapist-2", "room-3", "Paschat Karma"),
        ("14:00", "15:00", "therapy-2", "therapist-1", "room-1", "Purva Karma"),
        ("14:00", "15:00", "therapy-1", "therapist-2", "room-3", "Pradhana Karma"),
        ("15:00", "16:00", "therapy-2", "therapist-2", "room-3", "Purva Karma"),
        ("15:00", "16:00", "therapy-1", "therapist-1", "room-1", "Pradhana Karma"),
        ("16:00", "17:00", "therapy-1", "therapist-1", "room-1", "Purva Karma"),
        ("16:00", "17:00", "therapy-2", "therapist-2", "room-3", "Purva Karma"),
        ("17:00", "18:00", "therapy-1", "therapist-2", "room-3", "Pradhana Karma"),
        ("17:00", "18:00", "therapy-2", "therapist-1", "room-1", "Purva Karma"),
    ]
    statuses = ["Scheduled"] * 12 + ["Completed"] * 2 + ["Scheduled"] * 1

    for i, pid in enumerate(patient_ids[:15]):
        start, end, therapy_id, therapist_id, room_id, stage = slots[i]
        status = statuses[i]
        appt_id = f"appt-demo-{i + 1}"
        if db.get(Appointment, appt_id):
            continue
        t_key, r_key = slot_keys(therapist_id, room_id, today_iso, start, status)
        db.add(Appointment(
            id=appt_id,
            patient_id=pid,
            plan_id=f"plan-{i + 1}",
            therapy_id=therapy_id,
            therapist_id=therapist_id,
            room_id=room_id,
            date=today_iso,
            start_time=start,
            end_time=end,
            treatment_stage=stage,
            session_number=(i % 7) + 1,
            status=status,
            session_notes="Demo session for dashboard preview.",
            created_by="user-2",
            therapist_slot_key=t_key,
            room_slot_key=r_key,
            completed_at=datetime.now(timezone.utc) if status == "Completed" else None,
        ))
