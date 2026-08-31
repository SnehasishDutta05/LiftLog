from BE.app.schemas import SignupRequest


def test_signup_request_requires_full_name():
    payload = SignupRequest(full_name="Jane Doe", email="jane@example.com", password="secret123")
    assert payload.full_name == "Jane Doe"
    assert payload.email == "jane@example.com"
    assert payload.password == "secret123"
