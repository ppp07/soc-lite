from fastapi.testclient import TestClient

ALLOWED = "http://localhost:5173"
EVIL = "https://evil.example.com"


def test_preflight_from_allowed_origin(client: TestClient) -> None:
    response = client.options(
        "/api/v1/health",
        headers={
            "Origin": ALLOWED,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Authorization",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == ALLOWED
    assert response.headers["access-control-allow-credentials"] == "true"
    assert response.headers["access-control-max-age"] == "600"


def test_simple_request_from_allowed_origin(client: TestClient) -> None:
    response = client.get("/health", headers={"Origin": ALLOWED})
    assert response.headers["access-control-allow-origin"] == ALLOWED
    assert "X-Request-ID" in response.headers["access-control-expose-headers"]


def test_disallowed_origin_gets_no_cors_headers(client: TestClient) -> None:
    response = client.get("/health", headers={"Origin": EVIL})
    # Without Allow-Origin the browser blocks the response, whatever other CORS headers say.
    assert "access-control-allow-origin" not in response.headers


def test_preflight_from_disallowed_origin_rejected(client: TestClient) -> None:
    response = client.options(
        "/api/v1/health",
        headers={"Origin": EVIL, "Access-Control-Request-Method": "GET"},
    )
    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers


def test_wildcard_is_never_returned(client: TestClient) -> None:
    response = client.get("/health", headers={"Origin": ALLOWED})
    assert response.headers["access-control-allow-origin"] != "*"


def test_disallowed_header_and_method_in_preflight(client: TestClient) -> None:
    response = client.options(
        "/api/v1/health",
        headers={
            "Origin": ALLOWED,
            "Access-Control-Request-Method": "TRACE",
            "Access-Control-Request-Headers": "X-Custom-Evil",
        },
    )
    assert response.status_code == 400


def test_error_responses_still_carry_cors_headers(client: TestClient) -> None:
    response = client.get("/missing", headers={"Origin": ALLOWED})
    assert response.status_code == 404
    assert response.headers["access-control-allow-origin"] == ALLOWED
