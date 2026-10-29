"""Keeps a visit, its package bill, and its follow-up on the same records."""

from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.entities import Appointment, BillingRecord, FollowUp, PanchakarmaPlan

SESSION_FEE = Decimal("1000")
OPEN = ("Confirmed", "Scheduled")
ACTIVE_PLAN = ("In Progress", "Active")


def active_plan_for_patient(db: Session, patient_id: str) -> PanchakarmaPlan | None:
    rows = (
        db.query(PanchakarmaPlan)
        .filter(PanchakarmaPlan.patient_id == patient_id, PanchakarmaPlan.status.in_(ACTIVE_PLAN))
        .order_by(PanchakarmaPlan.created_at.desc())
        .all()
    )
    return rows[0] if rows else None


def apply_plan_fields(plan: PanchakarmaPlan, **fields) -> PanchakarmaPlan:
    for key, value in fields.items():
        if value is not None:
            setattr(plan, key, value)
    plan.status = "In Progress"
    return plan


def open_appointment(db: Session, patient_id: str, appointment_id: str | None = None) -> Appointment | None:
    if appointment_id:
        chosen = db.get(Appointment, appointment_id)
        if chosen and chosen.patient_id == patient_id and chosen.status in OPEN:
            return chosen
    rows = (
        db.query(Appointment)
        .filter(Appointment.patient_id == patient_id, Appointment.status.in_(OPEN))
        .all()
    )
    rows.sort(key=lambda item: (0 if item.status == "Confirmed" else 1, item.date or "", item.start_time or ""))
    return rows[0] if rows else None


def _invoice_number(db: Session, bill_date: str) -> str:
    year = bill_date[:4] if len(bill_date) >= 4 else str(datetime.now(timezone.utc).year)
    count = db.query(BillingRecord).count() + 1
    number = f"INV-{year}-{count:03d}"
    while db.query(BillingRecord).filter(BillingRecord.invoice_number == number).first():
        count += 1
        number = f"INV-{year}-{count:03d}"
    return number


def ensure_bill(
    db: Session,
    *,
    patient_id: str,
    appointment: Appointment | None = None,
    plan: PanchakarmaPlan | None = None,
    package_type: str = "Therapy session",
    sessions: int = 1,
) -> BillingRecord:
    query = db.query(BillingRecord).filter(BillingRecord.patient_id == patient_id)
    existing = None
    if plan is not None:
        existing = query.filter(BillingRecord.plan_id == plan.id).first()
    if existing is None and appointment is not None:
        existing = query.filter(BillingRecord.appointment_id == appointment.id).first()
    if existing is None and appointment is None:
        existing = (
            query.filter(
                BillingRecord.plan_id.is_(None),
                BillingRecord.appointment_id.is_(None),
                BillingRecord.payment_status == "Pending",
                BillingRecord.paid_amount == 0,
            )
            .order_by(BillingRecord.bill_date.desc())
            .first()
        )

    session_count = max(int(sessions or (plan.total_sessions if plan else 1) or 1), 1)
    amount = SESSION_FEE * session_count
    if existing:
        if plan is not None and not existing.plan_id:
            existing.plan_id = plan.id
        if appointment is not None and not existing.appointment_id:
            existing.appointment_id = appointment.id
        if plan is not None and existing.payment_status == "Pending" and existing.paid_amount == 0:
            existing.package_type = package_type or existing.package_type
            existing.subtotal = amount
            existing.total_amount = amount
            existing.items_json = "[]"
        return existing

    today = datetime.now(timezone.utc).date().isoformat()
    bill = BillingRecord(
        id=f"bill-{int(datetime.now().timestamp() * 1000)}",
        patient_id=patient_id,
        appointment_id=appointment.id if appointment else None,
        plan_id=plan.id if plan else None,
        invoice_number=_invoice_number(db, today),
        package_type=package_type,
        items_json="[]",
        subtotal=amount,
        discount=Decimal("0"),
        tax_amount=Decimal("0"),
        total_amount=amount,
        paid_amount=Decimal("0"),
        payment_status="Pending",
        payment_method="",
        bill_date=today,
    )
    db.add(bill)
    return bill


def ensure_followup(
    db: Session,
    *,
    patient_id: str,
    followup_date: str,
    plan_id: str | None = None,
    therapist_id: str | None = None,
) -> FollowUp | None:
    if not followup_date:
        return None
    query = db.query(FollowUp).filter(FollowUp.patient_id == patient_id)
    existing = query.filter(FollowUp.plan_id == plan_id).first() if plan_id else None
    if existing is None:
        existing = query.filter(FollowUp.followup_date == followup_date, FollowUp.status == "Pending").first()
    if existing:
        if existing.status == "Pending":
            existing.followup_date = followup_date
            if plan_id and not existing.plan_id:
                existing.plan_id = plan_id
            if therapist_id and not existing.therapist_id:
                existing.therapist_id = therapist_id
        return existing
    record = FollowUp(
        id=f"followup-{int(datetime.now().timestamp() * 1000)}",
        patient_id=patient_id,
        therapist_id=therapist_id,
        plan_id=plan_id,
        followup_date=followup_date,
        reminder_sent=0,
        status="Pending",
    )
    db.add(record)
    return record
