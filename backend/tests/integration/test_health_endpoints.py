import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app import __version__


@pytest.mark.parametrize("path", ["/health", "/api/v1/health"])
def test_health_ok(client: TestClient, path: str) -> None:
    response = client.get(path)
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "SOC-Lite", "version": __version__}


def test_ready_ok_without_dependencies(client: TestClient) -> None:
    response = client.get("/ready")
    assert response.status_code == 200
    assert response.json() == {"status": "ready", "checks": {}}


def test_ready_returns_503_when_check_fails(app: FastAPI, client: TestClient) -> None:
    async def failing() -> bool:
        return False

    app.state.readiness_checks["database"] = failing
    response = client.get("/ready")
    assert response.status_code == 503
    assert response.json() == {"status": "not_ready", "checks": {"database": "failed"}}


def test_ready_does_not_leak_check_exceptions(app: FastAPI, client: TestClient) -> None:
    async def exploding() -> bool:
        raise RuntimeError("mongodb://user:pass@host")

    app.state.readiness_checks["database"] = exploding
    response = client.get("/ready")
    assert response.status_code == 503
    assert "mongodb" not in response.text


def test_health_is_get_only(client: TestClient) -> None:
    response = client.post("/health")
    assert response.status_code == 405
    assert response.headers["content-type"].startswith("application/problem+json")


def test_openapi_lists_health_routes(client: TestClient) -> None:
    paths = client.get("/openapi.json").json()["paths"]
    assert {"/health", "/ready", "/api/v1/health"} <= set(paths)
