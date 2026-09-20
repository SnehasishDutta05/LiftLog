from uuid import uuid4

from fastapi.testclient import TestClient

from BE.app.db import SessionLocal
from BE.app.main import app
from BE.app.models import User, UserProfile

client = TestClient(app)


def test_profile_saves_versioned_snapshots_and_history():
    email = f"profile-{uuid4()}@example.com"
    signup = client.post(
        "/api/v1/auth/signup",
        json={"full_name": "Versioned User", "email": email, "password": "secret123"},
    )
    assert signup.status_code == 200, signup.text
    token = signup.json()["user"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    first = client.post(
        "/api/v1/profile",
        json={
            "height": "175 cm",
            "weight": "76 kg",
            "available_training_time": "60 minutes",
            "experience": "beginner",
        },
        headers=headers,
    )
    assert first.status_code == 200, first.text

    second = client.post(
        "/api/v1/profile",
        json={
            "weight": "75.5 kg",
        },
        headers=headers,
    )
    assert second.status_code == 200, second.text

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).one()
        profiles = db.query(UserProfile).filter(UserProfile.user_id == user.id).order_by(UserProfile.version).all()
        assert len(profiles) == 2, [p.version for p in profiles]
        assert profiles[0].version == 1
        assert profiles[0].weight == "76 kg"
        assert profiles[0].height == "175 cm"
        assert profiles[0].available_training_time == "60 minutes"

        latest = client.get("/api/v1/profile", headers=headers)
        assert latest.status_code == 200, latest.text
        latest_payload = latest.json()
        assert latest_payload["version"] == 2
        assert latest_payload["weight"] == "75.5 kg"
        assert latest_payload["height"] == "175 cm"
        assert latest_payload["available_training_time"] == "60 minutes"

        assert profiles[1].version == 2
        assert profiles[1].weight == "75.5 kg"
        assert profiles[1].height == "175 cm"
        assert profiles[1].available_training_time == "60 minutes"
    finally:
        db.close()

    history = client.get("/api/v1/profile/history", headers=headers)
    assert history.status_code == 200, history.text
    payload = history.json()
    assert payload["weight"][0]["value"] == "76 kg"
    assert payload["weight"][1]["value"] == "75.5 kg"
    assert payload["height"][0]["value"] == "175 cm"
    assert payload["available_training_time"][0]["value"] == "60 minutes"


def test_profile_get_accepts_numeric_height_and_weight_values():
    email = f"profile-float-{uuid4()}@example.com"
    signup = client.post(
        "/api/v1/auth/signup",
        json={"full_name": "Float User", "email": email, "password": "secret123"},
    )
    assert signup.status_code == 200, signup.text
    token = signup.json()["user"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).one()
        db.add(
            UserProfile(
                user_id=user.id,
                version=1,
                height=122.0,
                weight=100.0,
                available_training_time="60 minutes",
            )
        )
        db.commit()
    finally:
        db.close()

    response = client.get("/api/v1/profile", headers=headers)
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["height"] == "122.0"
    assert payload["weight"] == "100.0"
