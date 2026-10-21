"""Idempotent reference data. No passwords."""

from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.entities import (
    BillingRecord,
    FollowUp,
    InventoryItem,
    Patient,
    Receptionist,
    Therapist,
    Therapy,
    TherapyRoom,
    User,
)


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
                id="therapist-1", name="Amit Joshi", specialization="Abhyanga",
                specializations="Abhyanga,Swedana", therapy_ids="therapy-1",
                qualification="BAMS", experience=8, shift_start="09:00", shift_end="17:00",
                availability_status="Available", active=1,
            ),
            Therapist(
                id="therapist-2", name="Priya Sharma", specialization="Shirodhara",
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
