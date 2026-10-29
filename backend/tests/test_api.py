import os
import subprocess
import sys

from tests.conftest import auth, otp_token


def test_health(client):
    assert client.get("/health").json()["status"] == "ok"


def test_missing_token(client):
    assert client.get("/api/me").status_code == 401


def test_patient_cannot_read_other_patient(client):
    res = client.get("/api/patients/patient-1", headers=auth("user-3"))
    assert res.status_code == 200
    denied = client.get("/api/patients", headers=auth("user-3")).json()
    assert len(denied) == 1
    token = otp_token(client, auth("user-1"), "9000000001", "patient_register")
    other = client.post("/api/patients", headers=auth("user-1"), json={
        "fullName": "Other", "phone": "9000000001", "address": "Lane 1",
        "otpVerificationToken": token,
    })
    assert other.status_code == 201
    assert client.get(f"/api/patients/{other.json()['id']}", headers=auth("user-3")).status_code == 403


def test_duplicate_phone(client):
    body = {"fullName": "Dup", "phone": "9876543210", "address": "x"}
    assert client.post("/api/patients", headers=auth("user-2"), json=body).status_code == 409


def test_overlap_booking_and_cancel(client):
    slot = {
        "patientId": "patient-1", "therapyId": "therapy-1", "therapistId": "therapist-1",
        "roomId": "room-1", "date": "2026-12-01", "startTime": "09:00", "endTime": "10:00",
    }
    first = client.post("/api/appointments", headers=auth("user-2"), json=slot)
    assert first.status_code == 201
    second = client.post("/api/appointments", headers=auth("user-2"), json={**slot, "patientId": "patient-1"})
    assert second.status_code == 409
    cancelled = client.post(f"/api/appointments/{first.json()['id']}/cancel", headers=auth("user-2"))
    assert cancelled.json()["status"] == "Cancelled"
    again = client.post("/api/appointments", headers=auth("user-2"), json=slot)
    assert again.status_code == 201


def test_complete_increments_plan(client):
    plan = client.post("/api/plans", headers=auth("user-1"), json={
        "patientId": "patient-1", "procedureName": "Abhyanga", "totalSessions": 2,
    }).json()
    appt = client.post("/api/appointments", headers=auth("user-2"), json={
        "patientId": "patient-1", "therapyId": "therapy-1", "therapistId": "therapist-1",
        "roomId": "room-1", "date": "2026-12-02", "startTime": "11:00", "endTime": "12:00",
        "planId": plan["id"],
    }).json()
    done = client.post(f"/api/appointments/{appt['id']}/complete", headers=auth("user-1"), json={})
    assert done.status_code == 200
    plans = client.get("/api/plans", headers=auth("user-1")).json()
    match = next(p for p in plans if p["id"] == plan["id"])
    assert match["completedSessions"] == 1


def test_recommend_known_therapy(client):
    slots = client.post("/api/scheduling/recommend", headers=auth("user-2"), json={
        "patientId": "patient-1", "therapyId": "therapy-1", "preferredDate": "2026-12-20",
    }).json()
    assert len(slots) > 0
    assert slots[0]["therapy"]["name"] == "Abhyanga"
    assert sum(1 for s in slots if s["recommended"]) == 1


def test_recommend_unknown_therapy(client):
    slots = client.post("/api/scheduling/recommend", headers=auth("user-2"), json={
        "patientId": "patient-1", "therapyId": "therapy-99",
    }).json()
    assert slots == []


def test_billing_list_and_create(client):
    listed = client.get("/api/billing", headers=auth("user-2"))
    assert listed.status_code == 200
    assert any(b["invoiceNumber"] == "INV-2026-001" for b in listed.json())

    created = client.post("/api/billing", headers=auth("user-2"), json={
        "patientId": "patient-1",
        "packageType": "Abhyanga Package",
        "items": [{"description": "Session", "amount": 1500}],
        "subtotal": 1500,
        "discount": 0,
        "taxAmount": 75,
        "totalAmount": 1575,
        "paidAmount": 0,
        "paymentStatus": "Pending",
        "paymentMethod": "Cash",
        "date": "2026-12-01",
    })
    assert created.status_code == 201
    body = created.json()
    assert body["patientId"] == "patient-1"
    assert body["paymentStatus"] == "Pending"
    assert body["totalAmount"] == 1575
    assert body["items"][0]["description"] == "Session"

    paid = client.patch(
        f"/api/billing/{body['id']}/payment",
        headers=auth("user-2"),
        json={"paymentStatus": "Paid", "paidAmount": 1575},
    )
    assert paid.status_code == 200
    assert paid.json()["paymentStatus"] == "Paid"


def test_inventory_and_followups(client):
    inv = client.get("/api/inventory", headers=auth("user-2"))
    assert inv.status_code == 200
    assert any(i["name"] == "Mahanarayan Taila" for i in inv.json())

    added = client.post("/api/inventory", headers=auth("user-2"), json={
        "name": "Anu Taila",
        "category": "Therapeutic Oils",
        "unit": "Bottles",
        "currentStock": 20,
        "minThreshold": 5,
        "costPerUnit": 210,
        "indications": "Nasya",
    })
    assert added.status_code == 201
    assert added.json()["currentStock"] == 20

    stock = client.patch(
        f"/api/inventory/{added.json()['id']}/stock",
        headers=auth("user-2"),
        json={"currentStock": 18},
    )
    assert stock.json()["currentStock"] == 18

    follows = client.get("/api/followups", headers=auth("user-2"))
    assert follows.status_code == 200
    assert any(f["patientId"] == "patient-1" for f in follows.json())

    created = client.post("/api/followups", headers=auth("user-2"), json={
        "patientId": "patient-1",
        "therapistId": "therapist-1",
        "followupDate": "2026-10-01",
        "status": "Pending",
    })
    assert created.status_code == 201
    done = client.patch(
        f"/api/followups/{created.json()['id']}",
        headers=auth("user-2"),
        json={"status": "Completed", "reminderSent": True},
    )
    assert done.json()["status"] == "Completed"
    assert done.json()["reminderSent"] is True


def test_alembic_upgrade(tmp_path):
    db = tmp_path / "mig.db"
    root = os.path.join(os.path.dirname(__file__), "..")
    env = {**os.environ, "DATABASE_URL": f"sqlite:///{db}", "ALLOW_TEST_TOKENS": "true", "PYTHONPATH": root}
    proc = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=os.path.join(os.path.dirname(__file__), ".."),
        env=env,
        capture_output=True,
        text=True,
    )
    assert proc.returncode == 0, proc.stderr
    assert db.exists()
