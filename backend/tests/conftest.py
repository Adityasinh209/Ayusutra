import os

os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["ALLOW_TEST_TOKENS"] = "true"
os.environ["SMS_PROVIDER"] = "console"

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture()
def client():
    with TestClient(app) as c:
        yield c


def auth(user_id: str) -> dict:
    return {"Authorization": f"Bearer test:{user_id}"}


def otp_token(client, headers, phone, purpose):
    sent = client.post("/api/send-otp", headers=headers, json={"mobile": phone, "purpose": purpose})
    assert sent.status_code == 200, sent.text
    verified = client.post("/api/verify-otp", headers=headers, json={
        "mobile": phone, "purpose": purpose, "otp": sent.json()["debugOtp"],
    })
    assert verified.status_code == 200, verified.text
    return verified.json()["verificationToken"]


def emergency_fields(client, headers, name="Kin Contact", phone="9111000001"):
    return {
        "emergencyName": name,
        "emergencyPhone": phone,
        "emergencyOtpVerificationToken": otp_token(client, headers, phone, "emergency_contact"),
    }
