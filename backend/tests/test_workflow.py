from tests.conftest import auth, emergency_fields, otp_token


def test_otp_resend_wait_and_wrong_code(client):
    headers = auth("user-1")
    first = client.post("/api/send-otp", headers=headers, json={"mobile": "9000000099", "purpose": "patient_register"})
    assert first.status_code == 200
    assert first.json()["sent"] is True
    assert len(first.json()["debugOtp"]) == 6
    second = client.post("/api/send-otp", headers=headers, json={"mobile": "9000000099", "purpose": "patient_register"})
    assert second.status_code == 429
    wrong = client.post("/api/verify-otp", headers=headers, json={
        "mobile": "9000000099", "purpose": "patient_register", "otp": "000000",
    })
    assert wrong.status_code == 400


def test_cross_role_phone_and_staff_registration(client):
    admin = auth("user-admin")
    phone = "9001112233"
    token = otp_token(client, admin, phone, "therapist_register")
    created = client.post("/api/staff?role=therapist", headers=admin, json={
        "fullName": "New Therapist",
        "email": "new.therapist@ayursutra.dev",
        "mobile": phone,
        "qualification": "BAMS",
        "yearsOfExperience": 4,
        "otpVerificationToken": token,
    })
    assert created.status_code == 201, created.text
    blocked = client.post("/api/send-otp", headers=auth("user-2"), json={"mobile": phone, "purpose": "patient_register"})
    assert blocked.status_code == 409
    denied = client.post("/api/send-otp", headers=auth("user-2"), json={"mobile": "9001112244", "purpose": "therapist_register"})
    assert denied.status_code == 403


def test_patient_books_and_therapist_accepts(client):
    booked = client.post("/api/appointments", headers=auth("user-rahul-patel"), json={
        "patientId": "patient-rahul-patel",
        "therapyId": "therapy-1",
        "therapistId": "therapist-1",
        "roomId": "room-1",
        "date": "2026-12-03",
        "startTime": "10:00",
        "endTime": "11:00",
    })
    assert booked.status_code == 201, booked.text
    assert booked.json()["status"] == "Pending Confirmation"
    blocked = client.post(f"/api/appointments/{booked.json()['id']}/accept", headers=auth("user-4"))
    assert blocked.status_code == 403
    confirmed = client.post(f"/api/appointments/{booked.json()['id']}/accept", headers=auth("user-2"))
    assert confirmed.status_code == 200
    assert confirmed.json()["status"] == "Scheduled"
    visible = client.get("/api/appointments", headers=auth("user-4")).json()
    assert any(row["id"] == booked.json()["id"] and row["status"] == "Scheduled" for row in visible)


def test_booking_bill_and_consultation_followup_are_automatic(client):
    booked = client.post("/api/appointments", headers=auth("user-rahul-patel"), json={
        "patientId": "patient-rahul-patel",
        "therapyId": "therapy-1",
        "therapistId": "therapist-1",
        "roomId": "room-1",
        "date": "2026-12-08",
        "startTime": "15:00",
        "endTime": "16:00",
    })
    assert booked.status_code == 201, booked.text
    confirmed = client.post(f"/api/appointments/{booked.json()['id']}/accept", headers=auth("user-2"))
    assert confirmed.status_code == 200, confirmed.text
    bills = client.get("/api/billing", headers=auth("user-rahul-patel")).json()
    pending = next(bill for bill in bills if bill["appointmentId"] == booked.json()["id"])
    assert pending["paymentStatus"] == "Pending"
    assert pending["totalAmount"] == 1000

    saved = client.post("/api/emr", headers=auth("user-1"), json={
        "patientId": "patient-rahul-patel",
        "symptoms": "Stiffness returned",
        "diagnosis": "Vata",
        "treatmentPlan": "Repeat Abhyanga",
        "therapyId": "therapy-1",
        "numberOfSessions": 7,
        "followUpDate": "2026-12-20",
    })
    assert saved.status_code == 201, saved.text
    assert saved.json()["appointmentId"]
    refreshed = client.get("/api/billing", headers=auth("user-rahul-patel")).json()
    package = next(bill for bill in refreshed if bill["planId"] == saved.json()["planId"])
    assert package["totalAmount"] == 7000
    assert package["paymentStatus"] == "Pending"
    followups = client.get("/api/followups", headers=auth("user-rahul-patel")).json()
    assert any(item["followupDate"] == "2026-12-20" and item["status"] == "Pending" for item in followups)
    visits = client.get("/api/appointments", headers=auth("user-rahul-patel")).json()
    linked = next(item for item in visits if item["id"] == saved.json()["appointmentId"])
    assert linked["planId"] == saved.json()["planId"]


def test_afternoon_slots_skip_break(client):
    slots = client.post("/api/scheduling/recommend", headers=auth("user-2"), json={
        "patientId": "patient-1",
        "therapyId": "therapy-1",
        "preferredDate": "2026-12-21",
        "preferredTime": "afternoon",
    }).json()
    assert slots
    assert all(slot["startTime"] != "13:00" for slot in slots)


def test_review_journeys_and_history_upload(client):
    rahul = auth("user-rahul-patel")
    bills = client.get("/api/billing", headers=rahul).json()
    paid = next(bill for bill in bills if bill["invoiceNumber"] == "INV-2026-RAHUL")
    assert paid["paymentStatus"] == "Paid"
    assert paid["totalAmount"] == 7000
    followups = client.get("/api/followups", headers=rahul).json()
    assert followups[0]["status"] == "Completed"
    history = client.get("/api/patients/patient-rahul-patel/history", headers=rahul).json()
    assert history[0]["treatmentName"] == "Kati Basti"
    assert history[0]["reports"][0]["reportUrl"].endswith("rahul-kati-basti.png")
    hidden = client.get("/api/patients/patient-rahul-patel/history", headers=auth("user-3"))
    assert hidden.status_code == 403
    priya = client.get("/api/plans", headers=auth("user-priya-shah")).json()
    assert any(plan["id"] == "plan-priya-shah" and plan["status"] == "In Progress" for plan in priya)
    upload = client.post(
        "/api/patients/patient-priya-shah/history",
        headers=auth("user-priya-shah"),
        json={"hospitalName": "Prior Clinic", "treatmentName": "Nasya"},
    )
    assert upload.status_code == 201
    report = client.post(
        f"/api/patients/patient-priya-shah/history/{upload.json()['id']}/reports",
        headers=auth("user-priya-shah"),
        files={"file": ("note.png", b"\x89PNG\r\n", "image/png")},
    )
    assert report.status_code == 201, report.text
    assert report.json()["reports"]


def test_otp_lockout_after_max_attempts(client):
    headers = auth("user-1")
    sent = client.post("/api/send-otp", headers=headers, json={"mobile": "9000000088", "purpose": "patient_register"})
    assert sent.status_code == 200
    last = None
    for _ in range(5):
        last = client.post("/api/verify-otp", headers=headers, json={
            "mobile": "9000000088", "purpose": "patient_register", "otp": "000000",
        })
        assert last.status_code == 400
    assert "Too many incorrect attempts" in last.json()["detail"]
    locked = client.post("/api/verify-otp", headers=headers, json={
        "mobile": "9000000088", "purpose": "patient_register", "otp": sent.json()["debugOtp"],
    })
    assert locked.status_code == 400


def test_emergency_contact_otp_and_validation(client):
    headers = auth("user-1")
    token = otp_token(client, headers, "9000000077", "patient_register")
    same_number = client.post("/api/patients", headers=headers, json={
        "fullName": "Emergency Patient",
        "phone": "9000000077",
        "address": "Lane 2",
        "otpVerificationToken": token,
        "emergencyName": "Kin",
        "emergencyPhone": "9000000077",
        "emergencyOtpVerificationToken": "x",
    })
    assert same_number.status_code == 422
    created = client.post("/api/patients", headers=headers, json={
        "fullName": "Emergency Patient",
        "phone": "9000000077",
        "address": "Lane 2",
        "otpVerificationToken": token,
        **emergency_fields(client, headers, name="Meera Rao", phone="9111000099"),
    })
    assert created.status_code == 201, created.text
    assert created.json()["emergencyContact"] == "Meera Rao - 9111000099"


def test_recommend_filters_preferred_therapist(client):
    slots = client.post("/api/scheduling/recommend", headers=auth("user-2"), json={
        "patientId": "patient-1",
        "therapyId": "therapy-1",
        "preferredDate": "2026-12-22",
        "preferredTherapistId": "therapist-1",
    }).json()
    assert slots
    assert all(slot["therapistId"] == "therapist-1" for slot in slots)


def test_therapist_followup_updates_patient_plan(client):
    created = client.post("/api/followups", headers=auth("user-4"), json={
        "patientId": "patient-1",
        "followupDate": "2026-12-30",
        "status": "Pending",
    })
    assert created.status_code == 201, created.text
    assert created.json()["therapistId"] == "therapist-1"
    plans = client.get("/api/plans", headers=auth("user-3")).json()
    assert any(plan.get("followUpDate") == "2026-12-30" for plan in plans)
    follows = client.get("/api/followups", headers=auth("user-3")).json()
    assert any(item["followupDate"] == "2026-12-30" for item in follows)


def test_assignment_email_includes_booking_link(client, monkeypatch):
    sent = []

    def fake_send(to, subject, body, html=None):
        sent.append({"to": to, "subject": subject, "body": body, "html": html})
        return {"to": to, "sent": True}

    monkeypatch.setattr("app.services.notify._send", fake_send)
    saved = client.post("/api/emr", headers=auth("user-1"), json={
        "patientId": "patient-1",
        "symptoms": "Stiffness",
        "diagnosis": "Vata",
        "treatmentPlan": "Abhyanga course",
        "therapyId": "therapy-1",
        "numberOfSessions": 7,
        "dietaryInstructions": "Warm food only",
    })
    assert saved.status_code == 201, saved.text
    assert sent
    mail = sent[0]
    assert "Rahul" in mail["body"] or "patient" in mail["body"].lower()
    assert "Abhyanga" in mail["subject"] or "Abhyanga" in mail["body"]
    assert "/scheduling?therapyId=therapy-1" in mail["body"]
    assert mail["html"] and "Book your session" in mail["html"]


def test_delete_followup_keeps_patient_records(client):
    created = client.post("/api/followups", headers=auth("user-4"), json={
        "patientId": "patient-1",
        "followupDate": "2026-12-31",
        "status": "Pending",
    })
    assert created.status_code == 201, created.text
    followup_id = created.json()["id"]
    denied = client.delete(f"/api/followups/{followup_id}", headers=auth("user-3"))
    assert denied.status_code == 403
    deleted = client.delete(f"/api/followups/{followup_id}", headers=auth("user-4"))
    assert deleted.status_code == 200, deleted.text
    remaining = client.get("/api/followups", headers=auth("user-4")).json()
    assert all(item["id"] != followup_id for item in remaining)
    patient = client.get("/api/patients/patient-1", headers=auth("user-1"))
    assert patient.status_code == 200
    plans = client.get("/api/plans", headers=auth("user-1")).json()
    assert any(plan["patientId"] == "patient-1" for plan in plans)
    assert all(not (plan.get("followUpDate") == "2026-12-31" and plan["patientId"] == "patient-1") for plan in plans)


def test_followup_reminder_uses_smtp(client, monkeypatch):
    created = client.post("/api/followups", headers=auth("user-4"), json={
        "patientId": "patient-1",
        "followupDate": "2027-01-05",
        "status": "Pending",
    })
    assert created.status_code == 201, created.text
    followup_id = created.json()["id"]
    missing = client.post(f"/api/followups/{followup_id}/remind", headers=auth("user-4"))
    assert missing.status_code == 503
    listed = client.get("/api/followups", headers=auth("user-4")).json()
    rec = next(item for item in listed if item["id"] == followup_id)
    assert rec["reminderSent"] is False

    from app.core.config import settings
    monkeypatch.setattr(settings, "smtp_host", "smtp.example.com")
    sent = []

    def fake_send(to, subject, body, html=None):
        sent.append({"to": to, "subject": subject, "body": body})
        return {"to": to, "sent": True}

    monkeypatch.setattr("app.services.notify._send", fake_send)
    ok = client.post(f"/api/followups/{followup_id}/remind", headers=auth("user-4"))
    assert ok.status_code == 200, ok.text
    assert ok.json()["sent"] is True
    assert sent
    assert "Rahul" in sent[0]["body"]
    assert "2027-01-05" in sent[0]["body"]
    assert "Amit" in sent[0]["body"] or "therapist" in sent[0]["body"].lower()
    refreshed = client.get("/api/followups", headers=auth("user-4")).json()
    assert next(item for item in refreshed if item["id"] == followup_id)["reminderSent"] is True


def test_patient_cannot_cancel_but_can_request(client):
    booked = client.post("/api/appointments", headers=auth("user-rahul-patel"), json={
        "patientId": "patient-rahul-patel",
        "therapyId": "therapy-1",
        "therapistId": "therapist-1",
        "roomId": "room-1",
        "date": "2026-12-11",
        "startTime": "10:00",
        "endTime": "11:00",
    })
    assert booked.status_code == 201, booked.text
    appt_id = booked.json()["id"]
    blocked = client.post(f"/api/appointments/{appt_id}/cancel", headers=auth("user-rahul-patel"))
    assert blocked.status_code == 403
    requested = client.post(f"/api/appointments/{appt_id}/request-cancel", headers=auth("user-rahul-patel"))
    assert requested.status_code == 200, requested.text
    assert requested.json()["cancellationRequest"] == "Requested"
    assert requested.json()["status"] == "Pending Confirmation"
    rejected = client.post(f"/api/appointments/{appt_id}/reject-cancel", headers=auth("user-2"))
    assert rejected.status_code == 200
    assert rejected.json()["cancellationRequest"] == "Rejected"
    assert rejected.json()["status"] == "Pending Confirmation"
    requested_again = client.post(f"/api/appointments/{appt_id}/request-cancel", headers=auth("user-rahul-patel"))
    assert requested_again.status_code == 200
    approved = client.post(f"/api/appointments/{appt_id}/approve-cancel", headers=auth("user-2"))
    assert approved.status_code == 200, approved.text
    assert approved.json()["status"] == "Cancelled"


def test_staff_can_cancel_session_directly(client):
    booked = client.post("/api/appointments", headers=auth("user-2"), json={
        "patientId": "patient-rahul-patel",
        "therapyId": "therapy-1",
        "therapistId": "therapist-1",
        "roomId": "room-1",
        "date": "2026-12-12",
        "startTime": "10:00",
        "endTime": "11:00",
    })
    assert booked.status_code == 201, booked.text
    cancelled = client.post(f"/api/appointments/{booked.json()['id']}/cancel", headers=auth("user-4"))
    assert cancelled.status_code == 200, cancelled.text
    assert cancelled.json()["status"] == "Cancelled"

    booked2 = client.post("/api/appointments", headers=auth("user-2"), json={
        "patientId": "patient-rahul-patel",
        "therapyId": "therapy-1",
        "therapistId": "therapist-1",
        "roomId": "room-1",
        "date": "2026-12-13",
        "startTime": "10:00",
        "endTime": "11:00",
    })
    assert booked2.status_code == 201, booked2.text
    cancelled2 = client.post(f"/api/appointments/{booked2.json()['id']}/cancel", headers=auth("user-2"))
    assert cancelled2.status_code == 200
    assert cancelled2.json()["status"] == "Cancelled"


def test_patient_account_deletion_retains_records(client):
    booked = client.post("/api/appointments", headers=auth("user-priya-shah"), json={
        "patientId": "patient-priya-shah",
        "therapyId": "therapy-2",
        "therapistId": "therapist-2",
        "roomId": "room-3",
        "date": "2026-12-18",
        "startTime": "10:00",
        "endTime": "10:45",
    })
    assert booked.status_code == 201, booked.text
    blocked = client.post("/api/me/delete-account", headers=auth("user-priya-shah"))
    assert blocked.status_code == 409
    cancelled = client.post(f"/api/appointments/{booked.json()['id']}/cancel", headers=auth("user-2"))
    assert cancelled.status_code == 200
    remaining = [
        row for row in client.get("/api/appointments", headers=auth("user-priya-shah")).json()
        if row["status"] in ("Pending Confirmation", "Scheduled", "Confirmed")
    ]
    for row in remaining:
        assert client.post(f"/api/appointments/{row['id']}/cancel", headers=auth("user-2")).status_code == 200
    deleted = client.post("/api/me/delete-account", headers=auth("user-priya-shah"))
    assert deleted.status_code == 200, deleted.text
    me = client.get("/api/me", headers=auth("user-priya-shah"))
    assert me.status_code == 401
    retained = client.get("/api/patients/patient-priya-shah", headers=auth("user-1"))
    assert retained.status_code == 200
    assert retained.json()["fullName"]
