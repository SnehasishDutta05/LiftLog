import uuid

from fastapi.testclient import TestClient

from BE.app.db import SessionLocal, init_db
from BE.app.main import app
from BE.app.models import Gym


def _signup_and_headers(client: TestClient, email: str):
    response = client.post(
        "/api/v1/auth/signup",
        json={"full_name": "Gym Booker", "email": email, "password": "secret123"},
    )
    assert response.status_code == 200, response.text
    token = response.json()["user"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _seed_gym():
    db = SessionLocal()
    try:
        gym = Gym(
            name="IronCore Fitness",
            about="Premium fitness center with strength, cardio and functional training facilities.",
            status="active",
            address="Action Area 1, New Town, Kolkata",
            city="Kolkata",
            state="West Bengal",
            pincode="700156",
            latitude=22.5958,
            longitude=88.4797,
            google_maps_url="https://maps.google.com/?q=22.5958,88.4797",
            phone="+91XXXXXXXXXX",
            email="contact@ironcorefitness.com",
            image_url="https://cdn.liftlog.com/gyms/101/main.jpg",
            monday_open="06:00",
            monday_close="22:00",
            tuesday_open="06:00",
            tuesday_close="22:00",
            wednesday_open="06:00",
            wednesday_close="22:00",
            thursday_open="06:00",
            thursday_close="22:00",
            friday_open="06:00",
            friday_close="22:00",
            saturday_open="07:00",
            saturday_close="20:00",
            sunday_open="08:00",
            sunday_close="18:00",
            equipment_json='["Treadmill", "Squat Rack", "Bench Press"]',
            photos_json='["https://cdn.liftlog.com/gyms/101/1.jpg", "https://cdn.liftlog.com/gyms/101/2.jpg"]',
            slot_duration_minutes=30,
            max_bookings_per_slot=3,
        )
        db.add(gym)
        db.commit()
        db.refresh(gym)
        return gym
    finally:
        db.close()


def test_gym_booking_flow():
    init_db()
    client = TestClient(app)
    email = f"gym-booking-{uuid.uuid4().hex[:8]}@example.com"
    headers = _signup_and_headers(client, email)
    gym = _seed_gym()

    nearby = client.get("/api/v1/gyms/nearby", params={"lat": 22.5958, "lng": 88.4797, "radius": 10})
    assert nearby.status_code == 200, nearby.text
    nearby_payload = nearby.json()
    assert any(item["gym_id"] == gym.id for item in nearby_payload)

    details = client.get(f"/api/v1/gyms/{gym.id}/details")
    assert details.status_code == 200, details.text
    assert details.json()["name"] == "IronCore Fitness"
    assert details.json()["location"]["latitude"] == 22.5958

    slots = client.get(f"/api/v1/gyms/{gym.id}/slots", params={"from": "2026-09-21", "to": "2026-09-22"})
    assert slots.status_code == 200, slots.text
    payload = slots.json()
    assert payload["gym_id"] == gym.id
    assert len(payload["slots"]) > 0
    first_slot = payload["slots"][0]["slots"][0]
    slot_id = first_slot["slot_id"]

    booking = client.post(
        "/api/v1/bookings",
        json={"gym_id": gym.id, "slot_id": slot_id, "date": "2026-09-21"},
        headers=headers,
    )
    assert booking.status_code == 201, booking.text
    booking_payload = booking.json()
    assert booking_payload["status"] == "confirmed"
    assert booking_payload["gym"]["gym_id"] == gym.id

    my_bookings = client.get("/api/v1/bookings", headers=headers)
    assert my_bookings.status_code == 200, my_bookings.text
    assert any(item["booking_id"] == booking_payload["booking_id"] for item in my_bookings.json())
