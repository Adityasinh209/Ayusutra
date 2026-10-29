import json
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.serialize import row
from app.core.security import get_current_user, require_roles
from app.db.session import get_db
from app.models.entities import (
    Appointment, AuditEvent, BillingRecord, EmrRecord, FollowUp, InventoryItem, Patient,
    PanchakarmaPlan, Receptionist, Therapist, Therapy, TherapyRoom, User,
)
from app.services.booking import accept, book, cancel, complete, decline
from app.services.continuity import active_plan_for_patient, apply_plan_fields, ensure_bill, ensure_followup, open_appointment
from app.services.otp import consume_verification
from app.services.phones import assert_phone_available
from app.services.scheduling import recommend_slots

router = APIRouter()
STAFF = ("doctor", "therapist", "receptionist", "admin")
CLINICAL = ("doctor", "therapist", "admin")

PATIENT_FIELDS = [
    "id", "full_name", "phone", "email", "address", "date_of_birth", "gender", "blood_group",
    "emergency_contact", "chief_complaint", "medical_history", "allergies", "prakriti", "vikriti",
    "agni_type", "koshta_type", "user_id", "clerk_id", "registered_by", "registered_at",
]
BILLING_FIELDS = [
    "id", "patient_id", "appointment_id", "plan_id", "invoice_number", "package_type",
    "subtotal", "discount", "tax_amount", "total_amount", "paid_amount",
    "payment_status", "payment_method", "bill_date",
]
INVENTORY_FIELDS = [
    "id", "medicine_name", "quantity", "expiry_date", "supplier", "last_updated",
    "category", "unit", "min_threshold", "cost_per_unit", "indications",
]
FOLLOWUP_FIELDS = [
    "id", "patient_id", "therapist_id", "plan_id", "followup_date", "reminder_sent", "status",
]
PLAN_FIELDS = [
    "id", "patient_id", "doctor_id", "emr_id", "procedure_name", "primary_panchakarma", "treatment_stage",
    "total_sessions", "completed_sessions", "start_date", "end_date", "assigned_therapist_id",
    "assigned_room_id", "status", "doctor_instructions", "diet_plan", "follow_up_date", "created_at",
]
APPT_FIELDS = [
    "id", "patient_id", "plan_id", "therapy_id", "therapist_id", "room_id", "date", "start_time", "end_time",
    "treatment_stage", "session_number", "status", "session_notes", "therapist_observations",
    "doctor_remarks", "created_by", "created_at", "completed_at",
]


def _owns(user: User, patient_id: str) -> bool:
    return user.role != "patient" or user.patient_id == patient_id


def _audit(db: Session, actor: str, action: str, entity: str, entity_id: str):
    db.add(AuditEvent(actor_id=actor, action=action, entity=entity, entity_id=entity_id))


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/api/me")
def me(user: User = Depends(get_current_user)):
    return row(user, ["id", "name", "email", "role", "role_label", "patient_id", "therapist_id", "clerk_id"])


class IntakeBody(BaseModel):
    fullName: str
    phone: str
    address: str
    dateOfBirth: str = ""
    gender: str = ""
    email: str = ""
    emergencyContact: str = ""
    chiefComplaint: str = ""
    medicalHistory: str = ""
    allergies: str = ""
    otpVerificationToken: str = ""


@router.get("/api/patients")
def list_patients(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(Patient)
    if user.role == "patient":
        q = q.filter(Patient.id == user.patient_id)
    rows = q.order_by(Patient.registered_at.desc()).all()
    return [row(p, PATIENT_FIELDS) for p in rows]


@router.get("/api/patients/{patient_id}")
def get_patient(patient_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not _owns(user, patient_id):
        raise HTTPException(403, "Not allowed.")
    patient = db.get(Patient, patient_id)
    if patient is None:
        raise HTTPException(404, "Patient not found.")
    return row(patient, PATIENT_FIELDS)


@router.post("/api/patients", status_code=201)
def create_patient(body: IntakeBody, user: User = Depends(require_roles(*STAFF)), db: Session = Depends(get_db)):
    phone = assert_phone_available(db, body.phone)
    consume_verification(db, body.otpVerificationToken, phone, "patient_register")
    patient = Patient(
        id=f"patient-{int(datetime.now().timestamp()*1000)}",
        full_name=body.fullName.strip(), phone=phone, address=body.address.strip(), phone_verified=1,
        date_of_birth=body.dateOfBirth, gender=body.gender, email=body.email.strip(),
        emergency_contact=body.emergencyContact, chief_complaint=body.chiefComplaint,
        medical_history=body.medicalHistory, allergies=body.allergies, registered_by=user.id,
    )
    db.add(patient)
    _audit(db, user.id, "create", "patient", patient.id)
    db.commit()
    db.refresh(patient)
    return row(patient, PATIENT_FIELDS)


@router.post("/api/patients/intake")
def intake(body: IntakeBody, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "patient":
        raise HTTPException(403, "Not allowed.")
    existing = db.get(Patient, user.patient_id) if user.patient_id else None
    phone = assert_phone_available(
        db, body.phone,
        ignore_patient_id=existing.id if existing else None,
        ignore_user_id=user.id,
    )
    consume_verification(db, body.otpVerificationToken, phone, "patient_intake")
    if existing is None:
        existing = Patient(id=f"patient-{user.id}"[:64], phone=phone, registered_by=user.id, user_id=user.id, clerk_id=user.clerk_id)
        db.add(existing)
        user.patient_id = existing.id
    existing.full_name = body.fullName.strip()
    existing.phone = phone
    existing.phone_verified = 1
    user.phone = phone
    existing.address = body.address.strip()
    existing.date_of_birth = body.dateOfBirth
    existing.gender = body.gender
    existing.email = (body.email or user.email).strip()
    existing.emergency_contact = body.emergencyContact
    existing.chief_complaint = body.chiefComplaint
    existing.medical_history = body.medicalHistory
    existing.allergies = body.allergies
    existing.user_id = user.id
    existing.clerk_id = user.clerk_id
    _audit(db, user.id, "intake", "patient", existing.id)
    db.commit()
    db.refresh(existing)
    return row(existing, PATIENT_FIELDS)


class EmrBody(BaseModel):
    patientId: str
    symptoms: str = ""
    diagnosis: str = ""
    ashtavidhaPariksha: dict | None = None
    doshaAssessment: str = ""
    treatmentPlan: str = ""
    therapyId: str | None = None
    numberOfSessions: int = 0
    medicines: str = ""
    doctorNotes: str = ""
    dietaryInstructions: str = ""
    treatmentStage: str = "Purva Karma"
    followUpDate: str = ""
    appointmentId: str | None = None


@router.get("/api/patients/{patient_id}/emr")
def list_emr(patient_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not _owns(user, patient_id):
        raise HTTPException(403, "Not allowed.")
    rows = db.query(EmrRecord).filter(EmrRecord.patient_id == patient_id).order_by(EmrRecord.created_at.desc()).all()
    return [_emr(r) for r in rows]


@router.post("/api/emr", status_code=201)
def create_emr(body: EmrBody, user: User = Depends(require_roles(*CLINICAL)), db: Session = Depends(get_db)):
    if db.get(Patient, body.patientId) is None:
        raise HTTPException(404, "Patient not found.")
    rec = EmrRecord(
        id=f"emr-{int(datetime.now().timestamp()*1000)}",
        patient_id=body.patientId, doctor_id=user.id, symptoms=body.symptoms, diagnosis=body.diagnosis,
        ashtavidha_pariksha=json.dumps(body.ashtavidhaPariksha or {}),
        dosha_assessment=body.doshaAssessment, treatment_plan=body.treatmentPlan,
        therapy_id=body.therapyId, number_of_sessions=body.numberOfSessions,
        medicines=body.medicines, doctor_notes=body.doctorNotes,
        dietary_instructions=body.dietaryInstructions,
        treatment_stage=body.treatmentStage, follow_up_date=body.followUpDate,
        appointment_id=body.appointmentId,
    )
    linked = open_appointment(db, body.patientId, body.appointmentId)
    if linked:
        rec.appointment_id = linked.id
    db.add(rec)
    db.flush()
    plan = None
    if body.therapyId or body.treatmentPlan or body.numberOfSessions:
        therapy = db.get(Therapy, body.therapyId) if body.therapyId else None
        fields = dict(
            doctor_id=user.id,
            emr_id=rec.id,
            procedure_name=(therapy.name if therapy else None) or body.treatmentPlan or "Panchakarma Protocol",
            primary_panchakarma=(therapy.name if therapy else None) or "Purva Karma",
            treatment_stage=body.treatmentStage or "Purva Karma",
            total_sessions=body.numberOfSessions or 7,
            completed_sessions=0,
            start_date=datetime.now(timezone.utc).date().isoformat(),
            end_date=body.followUpDate,
            doctor_instructions=body.doctorNotes or body.treatmentPlan,
            diet_plan=body.dietaryInstructions or "Follow Pathya-Apathya as prescribed.",
            follow_up_date=body.followUpDate,
        )
        plan = active_plan_for_patient(db, body.patientId)
        if plan:
            apply_plan_fields(plan, **fields)
        else:
            plan = PanchakarmaPlan(id=f"plan-{rec.id}", patient_id=body.patientId, **fields)
            db.add(plan)
        if linked:
            plan.assigned_therapist_id = linked.therapist_id
            plan.assigned_room_id = linked.room_id
            linked.plan_id = plan.id
        rec.plan_id = plan.id
        ensure_bill(
            db,
            patient_id=body.patientId,
            appointment=linked,
            plan=plan,
            package_type=plan.procedure_name,
            sessions=plan.total_sessions,
        )
    if body.followUpDate:
        ensure_followup(
            db,
            patient_id=body.patientId,
            followup_date=body.followUpDate,
            plan_id=plan.id if plan else None,
            therapist_id=linked.therapist_id if linked else None,
        )
    _audit(db, user.id, "create", "emr", rec.id)
    db.commit()
    db.refresh(rec)
    return _emr(rec)


def _emr(r: EmrRecord) -> dict:
    data = row(r, [
        "id", "patient_id", "doctor_id", "plan_id", "symptoms", "diagnosis", "dosha_assessment",
        "treatment_plan", "therapy_id", "number_of_sessions", "medicines", "doctor_notes",
        "dietary_instructions", "treatment_stage", "follow_up_date", "appointment_id", "created_at",
    ])
    try:
        data["ashtavidhaPariksha"] = json.loads(r.ashtavidha_pariksha or "{}")
    except json.JSONDecodeError:
        data["ashtavidhaPariksha"] = {}
    return data


def _money(val) -> float:
    if val is None:
        return 0.0
    return float(val)


def _bill(b: BillingRecord) -> dict:
    data = row(b, BILLING_FIELDS)
    for key in ("subtotal", "discount", "taxAmount", "totalAmount", "paidAmount"):
        data[key] = _money(data.get(key))
    data["date"] = data.pop("billDate", b.bill_date)
    try:
        data["items"] = json.loads(b.items_json or "[]")
    except json.JSONDecodeError:
        data["items"] = []
    return data


def _inventory(item: InventoryItem) -> dict:
    data = row(item, INVENTORY_FIELDS)
    data["name"] = data.pop("medicineName", item.medicine_name)
    data["currentStock"] = data.pop("quantity", item.quantity)
    data["costPerUnit"] = _money(data.get("costPerUnit"))
    data["minThreshold"] = data.pop("minThreshold", item.min_threshold)
    return data


def _followup(f: FollowUp) -> dict:
    data = row(f, FOLLOWUP_FIELDS)
    data["reminderSent"] = bool(f.reminder_sent)
    return data



class PlanBody(BaseModel):
    patientId: str
    procedureName: str = ""
    primaryPanchakarma: str = ""
    treatmentStage: str = "Purva Karma"
    totalSessions: int = 7
    followUpDate: str = ""
    doctorInstructions: str = ""
    dietPlan: str = ""
    assignedTherapistId: str | None = None
    assignedRoomId: str | None = None


class StageBody(BaseModel):
    treatmentStage: str


@router.get("/api/plans")
def list_plans(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(PanchakarmaPlan)
    if user.role == "patient":
        q = q.filter(PanchakarmaPlan.patient_id == user.patient_id)
    return [row(p, PLAN_FIELDS) for p in q.order_by(PanchakarmaPlan.created_at.desc()).all()]


@router.post("/api/plans", status_code=201)
def create_plan(body: PlanBody, user: User = Depends(require_roles(*CLINICAL)), db: Session = Depends(get_db)):
    fields = dict(
        doctor_id=user.id,
        procedure_name=body.procedureName,
        primary_panchakarma=body.primaryPanchakarma,
        treatment_stage=body.treatmentStage,
        total_sessions=body.totalSessions,
        completed_sessions=0,
        follow_up_date=body.followUpDate,
        doctor_instructions=body.doctorInstructions,
        diet_plan=body.dietPlan,
        assigned_therapist_id=body.assignedTherapistId or None,
        assigned_room_id=body.assignedRoomId or None,
        start_date=datetime.now(timezone.utc).date().isoformat(),
    )
    plan = active_plan_for_patient(db, body.patientId)
    if plan:
        apply_plan_fields(plan, **fields)
        _audit(db, user.id, "update", "plan", plan.id)
    else:
        plan = PanchakarmaPlan(id=f"plan-{int(datetime.now().timestamp()*1000)}", patient_id=body.patientId, **fields)
        db.add(plan)
        _audit(db, user.id, "create", "plan", plan.id)
    db.commit()
    db.refresh(plan)
    return row(plan, PLAN_FIELDS)


@router.patch("/api/plans/{plan_id}/stage")
def update_stage(plan_id: str, body: StageBody, user: User = Depends(require_roles(*CLINICAL)), db: Session = Depends(get_db)):
    plan = db.get(PanchakarmaPlan, plan_id)
    if plan is None:
        raise HTTPException(404, "Panchakarma Plan not found.")
    plan.treatment_stage = body.treatmentStage
    if body.treatmentStage == "Completed":
        plan.status = "Completed"
    _audit(db, user.id, "stage", "plan", plan.id)
    db.commit()
    db.refresh(plan)
    return row(plan, PLAN_FIELDS)


class RecommendBody(BaseModel):
    patientId: str
    therapyId: str
    preferredDate: str = ""
    preferredTime: str = ""


@router.post("/api/scheduling/recommend")
def recommend(body: RecommendBody, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role == "patient":
        if user.patient_id != body.patientId:
            raise HTTPException(403, "Not allowed.")
    elif user.role not in STAFF:
        raise HTTPException(403, "Not allowed.")
    return recommend_slots(db, body.patientId, body.therapyId, body.preferredDate, body.preferredTime)


class BookBody(BaseModel):
    patientId: str
    therapyId: str
    therapistId: str
    roomId: str
    date: str
    startTime: str
    endTime: str
    treatmentStage: str = "Purva Karma"
    planId: str | None = None
    sessionNumber: int | None = None


class CompleteBody(BaseModel):
    sessionNotes: str = ""
    therapistObservations: str = ""
    doctorRemarks: str = ""


@router.get("/api/appointments")
def list_appts(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(Appointment)
    if user.role == "patient":
        q = q.filter(Appointment.patient_id == user.patient_id)
    elif user.role == "therapist" and user.therapist_id:
        q = q.filter(Appointment.therapist_id == user.therapist_id)
    return [row(a, APPT_FIELDS) for a in q.all()]


@router.post("/api/appointments", status_code=201)
def create_appt(body: BookBody, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role == "patient":
        if user.patient_id != body.patientId:
            raise HTTPException(403, "Not allowed.")
    elif user.role not in STAFF:
        raise HTTPException(403, "Not allowed.")
    appt = book(
        db, actor_id=user.id, patient_id=body.patientId, therapy_id=body.therapyId,
        therapist_id=body.therapistId, room_id=body.roomId, date=body.date,
        start_time=body.startTime, end_time=body.endTime, treatment_stage=body.treatmentStage,
        plan_id=body.planId, session_number=body.sessionNumber,
        pending=user.role == "patient",
    )
    return row(appt, APPT_FIELDS)


@router.post("/api/appointments/{appt_id}/complete")
def complete_appt(appt_id: str, body: CompleteBody, user: User = Depends(require_roles(*CLINICAL)), db: Session = Depends(get_db)):
    appt = db.get(Appointment, appt_id)
    if appt is None:
        raise HTTPException(404, "Session appointment not found.")
    appt = complete(db, appt, user.id, body.model_dump())
    return row(appt, APPT_FIELDS)


def _can_manage_appt(user: User, appt: Appointment) -> bool:
    if user.role in ("admin", "doctor"):
        return True
    if user.role == "therapist" and user.therapist_id == appt.therapist_id:
        return True
    if user.role == "receptionist":
        return True
    return user.role == "patient" and user.patient_id == appt.patient_id


@router.post("/api/appointments/{appt_id}/accept")
def accept_appt(appt_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    appt = db.get(Appointment, appt_id)
    if appt is None:
        raise HTTPException(404, "Appointment not found.")
    reception = user.role in ("receptionist", "admin")
    if user.role not in ("therapist", "admin", "doctor", "receptionist") or (
        user.role == "therapist" and user.therapist_id != appt.therapist_id
    ):
        raise HTTPException(403, "Not allowed.")
    return row(accept(db, appt, user.id, as_receptionist=reception), APPT_FIELDS)


@router.post("/api/appointments/{appt_id}/decline")
def decline_appt(appt_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    appt = db.get(Appointment, appt_id)
    if appt is None:
        raise HTTPException(404, "Appointment not found.")
    if user.role not in ("therapist", "admin", "doctor", "receptionist") or (
        user.role == "therapist" and user.therapist_id != appt.therapist_id
    ):
        raise HTTPException(403, "Not allowed.")
    return row(decline(db, appt, user.id), APPT_FIELDS)


@router.post("/api/appointments/{appt_id}/cancel")
def cancel_appt(appt_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    appt = db.get(Appointment, appt_id)
    if appt is None:
        raise HTTPException(404, "Appointment not found.")
    if not _can_manage_appt(user, appt):
        raise HTTPException(403, "Not allowed.")
    appt = cancel(db, appt, user.id)
    return row(appt, APPT_FIELDS)


@router.get("/api/therapies")
def therapies(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return [row(t, ["id", "name", "category", "stage", "default_duration_mins", "required_room_type", "required_therapist_specialization", "active"])
            for t in db.query(Therapy).filter(Therapy.active == 1).all()]


@router.get("/api/therapists")
def therapists(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return [row(t, [
        "id", "user_id", "name", "specializations", "qualification", "experience",
        "shift_start", "shift_end", "availability_status", "active",
    ]) for t in db.query(Therapist).filter(Therapist.active == 1).all()]


@router.get("/api/rooms")
def rooms(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return [row(r, ["id", "name", "room_type", "active"]) for r in db.query(TherapyRoom).filter(TherapyRoom.active == 1).all()]


@router.get("/api/receptionists")
def list_receptionists(user: User = Depends(require_roles(*STAFF)), db: Session = Depends(get_db)):
    return [row(r, ["id", "user_id", "shift", "address"]) for r in db.query(Receptionist).all()]


class BillBody(BaseModel):
    patientId: str
    appointmentId: str | None = None
    planId: str | None = None
    packageType: str = ""
    items: list | None = None
    subtotal: float = 0
    discount: float = 0
    taxAmount: float = 0
    totalAmount: float = 0
    paidAmount: float = 0
    paymentStatus: str = "Pending"
    paymentMethod: str = ""
    date: str = ""


class PaymentBody(BaseModel):
    paymentStatus: str
    paidAmount: float = 0


@router.get("/api/billing")
def list_bills(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(BillingRecord)
    if user.role == "patient":
        q = q.filter(BillingRecord.patient_id == user.patient_id)
    elif user.role not in STAFF:
        raise HTTPException(403, "Not allowed.")
    rows = q.order_by(BillingRecord.bill_date.desc()).all()
    return [_bill(b) for b in rows]


@router.post("/api/billing", status_code=201)
def create_bill(body: BillBody, user: User = Depends(require_roles(*STAFF)), db: Session = Depends(get_db)):
    if db.get(Patient, body.patientId) is None:
        raise HTTPException(404, "Patient not found.")
    if body.appointmentId and db.get(Appointment, body.appointmentId) is None:
        raise HTTPException(404, "Appointment not found.")
    stamp = int(datetime.now().timestamp() * 1000)
    bill_date = body.date or datetime.now(timezone.utc).date().isoformat()
    year = bill_date[:4] if len(bill_date) >= 4 else str(datetime.now(timezone.utc).year)
    count = db.query(BillingRecord).count() + 1
    bill = BillingRecord(
        id=f"bill-{stamp}",
        patient_id=body.patientId,
        appointment_id=body.appointmentId,
        plan_id=body.planId,
        invoice_number=f"INV-{year}-{str(count).zfill(3)}",
        package_type=body.packageType,
        items_json=json.dumps(body.items or []),
        subtotal=Decimal(str(body.subtotal)),
        discount=Decimal(str(body.discount)),
        tax_amount=Decimal(str(body.taxAmount)),
        total_amount=Decimal(str(body.totalAmount)),
        paid_amount=Decimal(str(body.paidAmount)),
        payment_status=body.paymentStatus,
        payment_method=body.paymentMethod,
        bill_date=bill_date,
    )
    db.add(bill)
    _audit(db, user.id, "create", "billing", bill.id)
    db.commit()
    db.refresh(bill)
    return _bill(bill)


@router.patch("/api/billing/{bill_id}/payment")
def update_payment(bill_id: str, body: PaymentBody, user: User = Depends(require_roles(*STAFF)), db: Session = Depends(get_db)):
    bill = db.get(BillingRecord, bill_id)
    if bill is None:
        raise HTTPException(404, "Bill not found.")
    bill.payment_status = body.paymentStatus
    bill.paid_amount = Decimal(str(body.paidAmount))
    _audit(db, user.id, "payment", "billing", bill.id)
    db.commit()
    db.refresh(bill)
    return _bill(bill)


class InventoryBody(BaseModel):
    name: str
    category: str = ""
    unit: str = ""
    currentStock: int = 0
    minThreshold: int = 10
    costPerUnit: float = 0
    indications: str = ""
    expiryDate: str = ""
    supplier: str = ""


class StockBody(BaseModel):
    currentStock: int


@router.get("/api/inventory")
def list_inventory(user: User = Depends(require_roles(*STAFF)), db: Session = Depends(get_db)):
    return [_inventory(i) for i in db.query(InventoryItem).order_by(InventoryItem.medicine_name).all()]


@router.post("/api/inventory", status_code=201)
def create_inventory(body: InventoryBody, user: User = Depends(require_roles(*STAFF)), db: Session = Depends(get_db)):
    today = datetime.now(timezone.utc).date().isoformat()
    item = InventoryItem(
        id=f"inv-{int(datetime.now().timestamp() * 1000)}",
        medicine_name=body.name.strip(),
        quantity=body.currentStock,
        expiry_date=body.expiryDate,
        supplier=body.supplier,
        last_updated=today,
        category=body.category,
        unit=body.unit,
        min_threshold=body.minThreshold,
        cost_per_unit=Decimal(str(body.costPerUnit)),
        indications=body.indications,
    )
    db.add(item)
    _audit(db, user.id, "create", "inventory", item.id)
    db.commit()
    db.refresh(item)
    return _inventory(item)


@router.patch("/api/inventory/{item_id}/stock")
def update_stock(item_id: str, body: StockBody, user: User = Depends(require_roles(*STAFF)), db: Session = Depends(get_db)):
    item = db.get(InventoryItem, item_id)
    if item is None:
        raise HTTPException(404, "Inventory item not found.")
    item.quantity = body.currentStock
    item.last_updated = datetime.now(timezone.utc).date().isoformat()
    _audit(db, user.id, "stock", "inventory", item.id)
    db.commit()
    db.refresh(item)
    return _inventory(item)


class FollowUpBody(BaseModel):
    patientId: str
    therapistId: str | None = None
    planId: str | None = None
    followupDate: str
    reminderSent: bool = False
    status: str = "Pending"


class FollowUpStatusBody(BaseModel):
    status: str
    reminderSent: bool | None = None


@router.get("/api/followups")
def list_followups(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(FollowUp)
    if user.role == "patient":
        q = q.filter(FollowUp.patient_id == user.patient_id)
    elif user.role == "therapist" and user.therapist_id:
        q = q.filter(FollowUp.therapist_id == user.therapist_id)
    return [_followup(f) for f in q.order_by(FollowUp.followup_date).all()]


@router.post("/api/followups", status_code=201)
def create_followup(body: FollowUpBody, user: User = Depends(require_roles(*STAFF)), db: Session = Depends(get_db)):
    if db.get(Patient, body.patientId) is None:
        raise HTTPException(404, "Patient not found.")
    if body.therapistId and db.get(Therapist, body.therapistId) is None:
        raise HTTPException(404, "Therapist not found.")
    rec = FollowUp(
        id=f"followup-{int(datetime.now().timestamp() * 1000)}",
        patient_id=body.patientId,
        therapist_id=body.therapistId,
        plan_id=body.planId,
        followup_date=body.followupDate,
        reminder_sent=1 if body.reminderSent else 0,
        status=body.status,
    )
    db.add(rec)
    _audit(db, user.id, "create", "followup", rec.id)
    db.commit()
    db.refresh(rec)
    return _followup(rec)


@router.patch("/api/followups/{followup_id}")
def update_followup(
    followup_id: str, body: FollowUpStatusBody,
    user: User = Depends(require_roles(*STAFF)), db: Session = Depends(get_db),
):
    rec = db.get(FollowUp, followup_id)
    if rec is None:
        raise HTTPException(404, "Follow-up not found.")
    rec.status = body.status
    if body.reminderSent is not None:
        rec.reminder_sent = 1 if body.reminderSent else 0
    _audit(db, user.id, "update", "followup", rec.id)
    db.commit()
    db.refresh(rec)
    return _followup(rec)
