from fastapi.testclient import TestClient

from BE.app.main import app

client = TestClient(app)


def test_complete_workout_and_history_endpoints():
    signup = client.post(
        "/api/v1/auth/signup",
        json={"full_name": "Workout Tester", "email": "workouttester@example.com", "password": "secret123"},
    )
    assert signup.status_code == 200, signup.text
    token = signup.json()["user"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    workout = client.post(
        "/api/v1/workouts",
        json={
            "routine_id": None,
            "started_at": "2026-09-01T18:00:00Z",
            "finished_at": "2026-09-01T19:05:00Z",
            "exercises": [
                {
                    "exercise_id": 1,
                    "sets": [
                        {"weight": 82.5, "reps": 8},
                        {"weight": 82.5, "reps": 7},
                    ],
                }
            ],
        },
        headers=headers,
    )
    assert workout.status_code == 201, workout.text
    body = workout.json()
    assert body["routine_id"] is None
    assert body["duration_seconds"] == 3900
    assert len(body["exercises"]) == 1
    assert len(body["exercises"][0]["sets"]) == 2

    top_sets = client.get("/api/v1/exercises/1/top-sets", headers=headers)
    assert top_sets.status_code == 200, top_sets.text
    payload = top_sets.json()
    assert payload["exercise_id"] == 1
    assert "top_sets" in payload

    history = client.get("/api/v1/exercises/1/history", headers=headers)
    assert history.status_code == 200, history.text
    assert history.json()["exercise_id"] == 1
