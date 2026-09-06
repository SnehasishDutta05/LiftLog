from datetime import date
from uuid import uuid4

from fastapi.testclient import TestClient

from BE.app.main import app


client = TestClient(app)


def test_diet_log_defaults_date_and_rejects_invalid_date():
    email = f"diet-{uuid4().hex}@example.com"
    signup = client.post(
        "/api/v1/auth/signup",
        json={"full_name": "Diet Tester", "email": email, "password": "secret123"},
    )
    assert signup.status_code == 200, signup.text
    headers = {"Authorization": f"Bearer {signup.json()['user']['access_token']}"}

    custom_food = client.post(
        "/api/v1/diet/custom-foods",
        headers=headers,
        json={
            "name": "Test Oats",
            "nutrition_per_100g": {
                "calories": 389,
                "protein_g": 16.9,
                "carbs_g": 66.3,
                "fat_g": 6.9,
                "fiber_g": 10.6,
            },
        },
    )
    assert custom_food.status_code == 201, custom_food.text
    custom_food_id = custom_food.json()["custom_food_id"]

    log = client.post(
        "/api/v1/diet/logs",
        headers=headers,
        json={
            "date": None,
            "meals": [{"meal_type": "Breakfast", "items": [{"custom_food_id": custom_food_id, "quantity_g": 50}]}],
        },
    )
    assert log.status_code == 201, log.text
    assert log.json()["date"] == date.today().isoformat()
    item = log.json()["meals"][0]["items"][0]
    assert item["food_id"] is None
    assert item["serving_id"] is None
    assert item["custom_food_id"] == custom_food_id

    invalid = client.post(
        "/api/v1/diet/logs",
        headers=headers,
        json={"date": "06/09/2026", "meals": []},
    )
    assert invalid.status_code == 422
    assert "YYYY-MM-DD" in invalid.text
