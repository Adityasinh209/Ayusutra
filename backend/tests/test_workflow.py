from tests.conftest import auth, otp_token


def test_otp_resend_wait_and_wrong_code(client):
    headers = auth("user-1")
    first = client.post("/api/send-otp", headers=headers, json={"mobile": "9000000099", "purpose": "patient_register"})
    assert first.status_code == 200
    assert first.json()["debugOtp"] == "123456"
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
