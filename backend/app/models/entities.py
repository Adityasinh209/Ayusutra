from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    clerk_id: Mapped[str | None] = mapped_column(String(128), unique=True, nullable=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    name: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(32))
    role_label: Mapped[str] = mapped_column(String(64), default="Patient")
    phone: Mapped[str] = mapped_column(String(32), default="")
    patient_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    therapist_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    active: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Patient(Base):
    __tablename__ = "patients"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    full_name: Mapped[str] = mapped_column(String(255), default="")
    phone: Mapped[str] = mapped_column(String(32), unique=True)
    email: Mapped[str] = mapped_column(String(255), default="")
    address: Mapped[str] = mapped_column(Text, default="")
    date_of_birth: Mapped[str] = mapped_column(String(16), default="")
    gender: Mapped[str] = mapped_column(String(16), default="")
    blood_group: Mapped[str] = mapped_column(String(10), default="")
    emergency_contact: Mapped[str] = mapped_column(String(255), default="")
    chief_complaint: Mapped[str] = mapped_column(Text, default="")
    medical_history: Mapped[str] = mapped_column(Text, default="")
    allergies: Mapped[str] = mapped_column(Text, default="")
    prakriti: Mapped[str] = mapped_column(String(64), default="")
    vikriti: Mapped[str] = mapped_column(String(64), default="")
    agni_type: Mapped[str] = mapped_column(String(64), default="")
    koshta_type: Mapped[str] = mapped_column(String(64), default="")
    user_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    clerk_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    registered_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    registered_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Therapy(Base):
    __tablename__ = "therapies"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(128), unique=True)
    category: Mapped[str] = mapped_column(String(64), default="")
    stage: Mapped[str] = mapped_column(String(64), default="Purva Karma")
    description: Mapped[str] = mapped_column(Text, default="")
    default_duration_mins: Mapped[int] = mapped_column(Integer, default=60)
    required_room_type: Mapped[str] = mapped_column(String(64), default="")
    required_therapist_specialization: Mapped[str] = mapped_column(String(64), default="")
    active: Mapped[int] = mapped_column(Integer, default=1)


class Therapist(Base):
    __tablename__ = "therapists"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=True)
    name: Mapped[str] = mapped_column(String(255))
    specialization: Mapped[str] = mapped_column(String(128), default="")
    specializations: Mapped[str] = mapped_column(Text, default="")  # comma-separated
    therapy_ids: Mapped[str] = mapped_column(Text, default="")
    qualification: Mapped[str] = mapped_column(String(100), default="")
    experience: Mapped[int] = mapped_column(Integer, default=0)
    shift_start: Mapped[str] = mapped_column(String(8), default="09:00")
    shift_end: Mapped[str] = mapped_column(String(8), default="17:00")
    availability_status: Mapped[str] = mapped_column(String(32), default="Available")
    active: Mapped[int] = mapped_column(Integer, default=1)


class TherapistLeave(Base):
    __tablename__ = "therapist_leaves"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    therapist_id: Mapped[str] = mapped_column(ForeignKey("therapists.id", ondelete="RESTRICT"))
    start_date: Mapped[str] = mapped_column(String(16))
    end_date: Mapped[str] = mapped_column(String(16))
    reason: Mapped[str] = mapped_column(String(255), default="")


class TherapyRoom(Base):
    __tablename__ = "therapy_rooms"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(128), unique=True)
    room_type: Mapped[str] = mapped_column(String(64))
    active: Mapped[int] = mapped_column(Integer, default=1)


class Receptionist(Base):
    __tablename__ = "receptionists"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), unique=True)
    shift: Mapped[str] = mapped_column(String(20), default="")
    address: Mapped[str] = mapped_column(Text, default="")


class EmrRecord(Base):
    __tablename__ = "emr_records"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id", ondelete="RESTRICT"), index=True)
    doctor_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    plan_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    symptoms: Mapped[str] = mapped_column(Text, default="")
    diagnosis: Mapped[str] = mapped_column(Text, default="")
    ashtavidha_pariksha: Mapped[str] = mapped_column(Text, default="{}")
    dosha_assessment: Mapped[str] = mapped_column(Text, default="")
    treatment_plan: Mapped[str] = mapped_column(Text, default="")
    therapy_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    number_of_sessions: Mapped[int] = mapped_column(Integer, default=0)
    medicines: Mapped[str] = mapped_column(Text, default="")
    doctor_notes: Mapped[str] = mapped_column(Text, default="")
    dietary_instructions: Mapped[str] = mapped_column(Text, default="")
    treatment_stage: Mapped[str] = mapped_column(String(64), default="Purva Karma")
    follow_up_date: Mapped[str] = mapped_column(String(16), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)


class PanchakarmaPlan(Base):
    __tablename__ = "panchakarma_plans"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id", ondelete="RESTRICT"), index=True)
    doctor_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    emr_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    procedure_name: Mapped[str] = mapped_column(String(255), default="")
    primary_panchakarma: Mapped[str] = mapped_column(String(128), default="")
    treatment_stage: Mapped[str] = mapped_column(String(64), default="Purva Karma")
    total_sessions: Mapped[int] = mapped_column(Integer, default=7)
    completed_sessions: Mapped[int] = mapped_column(Integer, default=0)
    start_date: Mapped[str] = mapped_column(String(16), default="")
    end_date: Mapped[str] = mapped_column(String(16), default="")
    assigned_therapist_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    assigned_room_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="In Progress")
    doctor_instructions: Mapped[str] = mapped_column(Text, default="")
    diet_plan: Mapped[str] = mapped_column(Text, default="")
    follow_up_date: Mapped[str] = mapped_column(String(16), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Appointment(Base):
    __tablename__ = "appointments"
    __table_args__ = (
        UniqueConstraint("therapist_slot_key", name="uq_therapist_slot"),
        UniqueConstraint("room_slot_key", name="uq_room_slot"),
    )
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id", ondelete="RESTRICT"), index=True)
    plan_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    therapy_id: Mapped[str] = mapped_column(ForeignKey("therapies.id", ondelete="RESTRICT"))
    therapist_id: Mapped[str] = mapped_column(ForeignKey("therapists.id", ondelete="RESTRICT"))
    room_id: Mapped[str] = mapped_column(ForeignKey("therapy_rooms.id", ondelete="RESTRICT"))
    date: Mapped[str] = mapped_column(String(16), index=True)
    start_time: Mapped[str] = mapped_column(String(8))
    end_time: Mapped[str] = mapped_column(String(8))
    treatment_stage: Mapped[str] = mapped_column(String(64), default="Purva Karma")
    session_number: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String(32), default="Scheduled")
    session_notes: Mapped[str] = mapped_column(Text, default="")
    therapist_observations: Mapped[str] = mapped_column(Text, default="")
    doctor_remarks: Mapped[str] = mapped_column(Text, default="")
    created_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    # NULL when cancelled so the unique slot can be reused.
    therapist_slot_key: Mapped[str | None] = mapped_column(String(128), nullable=True)
    room_slot_key: Mapped[str | None] = mapped_column(String(128), nullable=True)


class BillingRecord(Base):
    __tablename__ = "billing_records"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id", ondelete="RESTRICT"), index=True)
    appointment_id: Mapped[str | None] = mapped_column(ForeignKey("appointments.id", ondelete="RESTRICT"), nullable=True)
    plan_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    invoice_number: Mapped[str] = mapped_column(String(64), unique=True)
    package_type: Mapped[str] = mapped_column(String(255), default="")
    items_json: Mapped[str] = mapped_column(Text, default="[]")
    subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    discount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    paid_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    payment_status: Mapped[str] = mapped_column(String(32), default="Pending")
    payment_method: Mapped[str] = mapped_column(String(30), default="")
    bill_date: Mapped[str] = mapped_column(String(16), default="")


class InventoryItem(Base):
    __tablename__ = "inventory_items"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    medicine_name: Mapped[str] = mapped_column(String(100))
    quantity: Mapped[int] = mapped_column(Integer, default=0)
    expiry_date: Mapped[str] = mapped_column(String(16), default="")
    supplier: Mapped[str] = mapped_column(String(100), default="")
    last_updated: Mapped[str] = mapped_column(String(16), default="")
    category: Mapped[str] = mapped_column(String(64), default="")
    unit: Mapped[str] = mapped_column(String(32), default="")
    min_threshold: Mapped[int] = mapped_column(Integer, default=10)
    cost_per_unit: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    indications: Mapped[str] = mapped_column(Text, default="")


class FollowUp(Base):
    __tablename__ = "followups"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id", ondelete="RESTRICT"), index=True)
    therapist_id: Mapped[str | None] = mapped_column(ForeignKey("therapists.id", ondelete="RESTRICT"), nullable=True)
    plan_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    followup_date: Mapped[str] = mapped_column(String(16), default="")
    reminder_sent: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(32), default="Pending")


class AuditEvent(Base):
    __tablename__ = "audit_events"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    actor_id: Mapped[str] = mapped_column(String(64))
    action: Mapped[str] = mapped_column(String(64))
    entity: Mapped[str] = mapped_column(String(64))
    entity_id: Mapped[str] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
