import os

os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["ALLOW_TEST_TOKENS"] = "true"

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture()
def client():
    with TestClient(app) as c:
        yield c


def auth(user_id: str) -> dict:
    return {"Authorization": f"Bearer test:{user_id}"}
