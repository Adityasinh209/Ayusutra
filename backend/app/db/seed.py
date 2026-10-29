"""Idempotent reference data. No passwords."""

import base64
from decimal import Decimal

from sqlalchemy.orm import Session

from app.db.seed_dashboard import seed_dashboard_demo
from app.models.entities import (
    Appointment,
    BillingRecord,
    EmrRecord,
    FollowUp,
    InventoryItem,
    Patient,
    PanchakarmaPlan,
    PreviousTreatmentHistory,
    PreviousTreatmentReport,
    Receptionist,
    Therapist,
    TherapistAvailability,
    Therapy,
    TherapyRoom,
    User,
)

WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]


def seed(db: Session) -> None:
    if not db.get(Therapy, "therapy-1"):
        db.add_all([
            Therapy(
                id="therapy-1", name="Abhyanga", category="Supportive Therapy", stage="Purva Karma",
                default_duration_mins=60, required_room_type="Abhyanga Room",
                required_therapist_specialization="Abhyanga", active=1,
            ),
            Therapy(
                id="therapy-2", name="Shirodhara", category="Supportive Therapy", stage="Purva Karma",
                default_duration_mins=45, required_room_type="Shirodhara Room",
                required_therapist_specialization="Shirodhara", active=1,
            ),
            Therapist(
                id="therapist-1", name="Amit Joshi",
                specializations="Abhyanga,Swedana", therapy_ids="therapy-1",
                qualification="BAMS", experience=8, shift_start="09:00", shift_end="17:00",
                availability_status="Available", active=1,
            ),
            Therapist(
                id="therapist-2", name="Priya Sharma",
                specializations="Shirodhara", therapy_ids="therapy-2",
                qualification="BAMS, MD (Panchakarma)", experience=5, shift_start="10:00", shift_end="18:00",
                availability_status="Available", active=1,
            ),
            TherapyRoom(id="room-1", name="Abhyanga Shala 1", room_type="Abhyanga Room", active=1),
            TherapyRoom(id="room-3", name="Shirodhara Kutir", room_type="Shirodhara Room", active=1),
            User(
                id="user-1", email="doctor@ayursutra.dev", name="Dr. Meera Nair",
                role="doctor", role_label="Doctor", phone="9876501001", active=1,
            ),
            User(
                id="user-2", email="receptionist@ayursutra.dev", name="Sunita Verma",
                role="receptionist", role_label="Front Desk", phone="9876501002", active=1,
            ),
            User(
                id="user-4", email="therapist@ayursutra.dev", name="Amit Joshi",
                role="therapist", role_label="Therapist", therapist_id="therapist-1",
                phone="9876501004", active=1,
            ),
            Patient(
                id="patient-1", full_name="Rahul Sharma", phone="9876543210", email="rahul.sharma@email.com",
                address="12, Lotus Society, Pune", date_of_birth="1985-04-12", gender="Male",
                blood_group="B+", emergency_contact="Sneha Sharma - 9876500001", prakriti="Vata-Pitta",
                registered_by="user-2",
            ),
            User(
                id="user-3", email="patient@ayursutra.dev", name="Rahul Sharma", role="patient",
                role_label="Patient", patient_id="patient-1", phone="9876543210", active=1,
            ),
        ])
        db.commit()

    _seed_clinic_gaps(db)
    seed_dashboard_demo(db)
    _seed_review_cases(db)


def _seed_clinic_gaps(db: Session) -> None:
    """Fill receptionist / inventory / billing / follow-up rows even when core seed already ran."""
    therapist = db.get(Therapist, "therapist-1")
    if therapist and not therapist.user_id:
        therapist.user_id = "user-4"
        therapist.qualification = therapist.qualification or "BAMS"
        therapist.experience = therapist.experience or 8
        therapist.shift_start = therapist.shift_start or "09:00"
        therapist.shift_end = therapist.shift_end or "17:00"
        therapist.availability_status = therapist.availability_status or "Available"

    therapist2 = db.get(Therapist, "therapist-2")
    if therapist2 and not therapist2.qualification:
        therapist2.qualification = "BAMS, MD (Panchakarma)"
        therapist2.experience = 5
        therapist2.shift_start = "10:00"
        therapist2.shift_end = "18:00"
        therapist2.availability_status = "Available"

    patient = db.get(Patient, "patient-1")
    if patient and not patient.blood_group:
        patient.blood_group = "B+"

    if not db.get(User, "user-admin"):
        db.add(User(
            id="user-admin", email="admin@ayursutra.dev", name="Clinic Admin",
            role="admin", role_label="Admin", phone="9876501009", active=1,
        ))

    if not db.get(Receptionist, "receptionist-1") and db.get(User, "user-2"):
        db.add(Receptionist(
            id="receptionist-1", user_id="user-2", shift="Morning",
            address="Clinic Front Desk, Pune",
        ))

    if not db.get(InventoryItem, "inv-1"):
        db.add_all([
            InventoryItem(
                id="inv-1", medicine_name="Mahanarayan Taila", quantity=45,
                expiry_date="2027-12-31", supplier="Arya Vaidya Pharmacy",
                last_updated="2026-08-01", category="Therapeutic Oils", unit="Liters",
                min_threshold=15, cost_per_unit=Decimal("850"),
                indications="Abhyanga, Kati Basti for chronic Vata disorders",
            ),
            InventoryItem(
                id="inv-2", medicine_name="Brahmi-Ksheerabala Taila", quantity=28,
                expiry_date="2027-06-30", supplier="Kottakkal Arya Vaidya Sala",
                last_updated="2026-08-01", category="Therapeutic Oils", unit="Liters",
                min_threshold=10, cost_per_unit=Decimal("1200"),
                indications="Shirodhara for stress and Pitta disorders",
            ),
            InventoryItem(
                id="inv-3", medicine_name="Dashamoola Kwatha Churna", quantity=35,
                expiry_date="2027-03-31", supplier="Local Herbal Supplier",
                last_updated="2026-08-01", category="Herbal Preparations", unit="Kilograms",
                min_threshold=10, cost_per_unit=Decimal("420"),
                indications="Decoction for Niruha Basti and Bashpa Swedana",
            ),
        ])

    if not db.get(BillingRecord, "bill-1") and db.get(Patient, "patient-1"):
        db.add(BillingRecord(
            id="bill-1",
            patient_id="patient-1",
            appointment_id=None,
            plan_id=None,
            invoice_number="INV-2026-001",
            package_type="Panchakarma Treatment Package (Yoga Basti 14 Days)",
            items_json='[{"description":"Initial Vaidya Consultation","amount":800},{"description":"Purva Karma sessions","amount":8400}]',
            subtotal=Decimal("9200"),
            discount=Decimal("0"),
            tax_amount=Decimal("460"),
            total_amount=Decimal("9660"),
            paid_amount=Decimal("9660"),
            payment_status="Paid",
            payment_method="UPI / Digital",
            bill_date="2026-08-14",
        ))

    for therapist_id, start, end in (("therapist-1", "09:00", "17:00"), ("therapist-2", "10:00", "18:00")):
        if db.get(Therapist, therapist_id) and not db.query(TherapistAvailability).filter(
            TherapistAvailability.therapist_id == therapist_id
        ).first():
            for day in WEEKDAYS:
                db.add(TherapistAvailability(
                    id=f"avail-{therapist_id}-{day}",
                    therapist_id=therapist_id,
                    day=day,
                    working=1,
                    start_time=start,
                    end_time=end,
                    break_start="13:00",
                    break_end="14:00",
                ))

    if not db.get(FollowUp, "followup-1") and db.get(Patient, "patient-1"):
        db.add(FollowUp(
            id="followup-1",
            patient_id="patient-1",
            therapist_id="therapist-1",
            plan_id=None,
            followup_date="2026-09-01",
            reminder_sent=0,
            status="Pending",
        ))

    db.commit()


def _seed_review_cases(db: Session) -> None:
    """Completed Rahul Patel and in-progress Priya Shah journeys for the review demo."""
    if db.get(Patient, "patient-rahul-patel"):
        return
    db.add_all([
        Patient(
            id="patient-rahul-patel", full_name="Rahul Patel", phone="9811100001",
            email="rahul.patel@email.com", address="18, River View, Ahmedabad",
            date_of_birth="1988-02-11", gender="Male", blood_group="O+",
            emergency_contact="Meera Patel - 9811100091", chief_complaint="Chronic low back stiffness",
            medical_history="Earlier Kati Basti course at a city clinic.", prakriti="Vata",
            phone_verified=1, registered_by="user-2", user_id="user-rahul-patel",
        ),
        User(
            id="user-rahul-patel", email="rahul.patel@ayursutra.dev", name="Rahul Patel",
            role="patient", role_label="Patient", phone="9811100001",
            patient_id="patient-rahul-patel", active=1,
        ),
        Patient(
            id="patient-priya-shah", full_name="Priya Shah", phone="9811100002",
            email="priya.shah@email.com", address="44, Paldi, Ahmedabad",
            date_of_birth="1994-07-19", gender="Female", blood_group="A+",
            emergency_contact="Amit Shah - 9811100092", chief_complaint="Stress and disturbed sleep",
            prakriti="Pitta", phone_verified=1, registered_by="user-2", user_id="user-priya-shah",
        ),
        User(
            id="user-priya-shah", email="priya.shah@ayursutra.dev", name="Priya Shah",
            role="patient", role_label="Patient", phone="9811100002",
            patient_id="patient-priya-shah", active=1,
        ),
        PanchakarmaPlan(
            id="plan-rahul-patel", patient_id="patient-rahul-patel", doctor_id="user-1",
            emr_id="emr-rahul-patel", procedure_name="Abhyanga", primary_panchakarma="Abhyanga",
            treatment_stage="Completed", total_sessions=7, completed_sessions=7,
            start_date="2026-08-01", end_date="2026-08-14", assigned_therapist_id="therapist-1",
            assigned_room_id="room-1", status="Completed",
            doctor_instructions="Course completed. Continue warm diet.",
            diet_plan="Warm khichdi and cumin water.", follow_up_date="2026-09-15",
        ),
        EmrRecord(
            id="emr-rahul-patel", patient_id="patient-rahul-patel", doctor_id="user-1",
            plan_id="plan-rahul-patel", symptoms="Low back stiffness", diagnosis="Vata vitiation",
            treatment_plan="Seven Abhyanga sessions", therapy_id="therapy-1", number_of_sessions=7,
            treatment_stage="Completed", follow_up_date="2026-09-15", appointment_id="appt-rahul-patel",
        ),
        Appointment(
            id="appt-rahul-patel", patient_id="patient-rahul-patel", plan_id="plan-rahul-patel",
            therapy_id="therapy-1", therapist_id="therapist-1", room_id="room-1",
            date="2026-08-14", start_time="09:00", end_time="10:00", treatment_stage="Paschat Karma",
            session_number=7, status="Completed", session_notes="Final session completed.",
            created_by="user-2", therapist_slot_key="therapist-1|2026-08-14|09:00",
            room_slot_key="room-1|2026-08-14|09:00",
        ),
        BillingRecord(
            id="bill-rahul-patel", patient_id="patient-rahul-patel", appointment_id="appt-rahul-patel",
            plan_id="plan-rahul-patel", invoice_number="INV-2026-RAHUL",
            package_type="Completed Abhyanga course", items_json="[]",
            subtotal=Decimal("7000"), discount=Decimal("0"), tax_amount=Decimal("0"),
            total_amount=Decimal("7000"), paid_amount=Decimal("7000"),
            payment_status="Paid", payment_method="UPI", bill_date="2026-08-14",
        ),
        FollowUp(
            id="followup-rahul-patel", patient_id="patient-rahul-patel", therapist_id="therapist-1",
            plan_id="plan-rahul-patel", followup_date="2026-09-15", reminder_sent=1, status="Completed",
        ),
        PreviousTreatmentHistory(
            id="history-rahul-patel", patient_id="patient-rahul-patel",
            hospital_name="City Ayurveda Clinic", therapist_name="Dr. Iyer",
            treatment_name="Kati Basti", diagnosis="Lumbar Vata",
            start_date="2025-11-01", end_date="2025-11-10",
            medicines="Mahanarayan taila", notes="Earlier local course before AyurSutra.",
        ),
        PreviousTreatmentReport(
            id="report-rahul-patel", history_id="history-rahul-patel",
            file_name="kati-basti-report.png", content_type="image/png",
            stored_name="rahul-kati-basti.png",
        ),
        PanchakarmaPlan(
            id="plan-priya-shah", patient_id="patient-priya-shah", doctor_id="user-1",
            emr_id="emr-priya-shah", procedure_name="Shirodhara", primary_panchakarma="Shirodhara",
            treatment_stage="Pradhana Karma", total_sessions=7, completed_sessions=3,
            start_date="2026-10-01", end_date="2026-11-12", assigned_therapist_id="therapist-2",
            assigned_room_id="room-3", status="In Progress",
            doctor_instructions="Continue Shirodhara. Avoid late nights.",
            diet_plan="Cooling, freshly cooked meals.", follow_up_date="2026-11-20",
        ),
        EmrRecord(
            id="emr-priya-shah", patient_id="patient-priya-shah", doctor_id="user-1",
            plan_id="plan-priya-shah", symptoms="Disturbed sleep and irritability",
            diagnosis="Pitta aggravation", treatment_plan="Seven Shirodhara sessions",
            therapy_id="therapy-2", number_of_sessions=7, treatment_stage="Pradhana Karma",
            follow_up_date="2026-11-20", appointment_id="appt-priya-shah",
        ),
        Appointment(
            id="appt-priya-shah", patient_id="patient-priya-shah", plan_id="plan-priya-shah",
            therapy_id="therapy-2", therapist_id="therapist-2", room_id="room-3",
            date="2026-11-02", start_time="11:00", end_time="11:45", treatment_stage="Pradhana Karma",
            session_number=4, status="Confirmed", session_notes="Upcoming therapy session.",
            created_by="user-2", therapist_slot_key="therapist-2|2026-11-02|11:00",
            room_slot_key="room-3|2026-11-02|11:00",
        ),
        BillingRecord(
            id="bill-priya-shah", patient_id="patient-priya-shah", appointment_id="appt-priya-shah",
            plan_id="plan-priya-shah", invoice_number="INV-2026-PRIYA",
            package_type="Shirodhara course in progress", items_json="[]",
            subtotal=Decimal("4500"), discount=Decimal("0"), tax_amount=Decimal("0"),
            total_amount=Decimal("4500"), paid_amount=Decimal("1500"),
            payment_status="Partial", payment_method="Cash", bill_date="2026-10-01",
        ),
        FollowUp(
            id="followup-priya-shah", patient_id="patient-priya-shah", therapist_id="therapist-2",
            plan_id="plan-priya-shah",             followup_date="2026-11-20", reminder_sent=0, status="Pending",
        ),
    ])
    from app.services.uploads import upload_root
    folder = upload_root() / "reports"
    folder.mkdir(parents=True, exist_ok=True)
    png = base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
    )
    (folder / "rahul-kati-basti.png").write_bytes(png)
    db.commit()
