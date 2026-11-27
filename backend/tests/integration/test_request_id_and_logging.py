import json

import pytest
from fastapi.testclient import TestClient


def test_generated_request_id_header(client: TestClient) -> None:
    response = client.get("/health")
    assert len(response.headers["X-Request-ID"]) == 32


def test_valid_request_id_is_echoed(client: TestClient) -> None:
    response = client.get("/health", headers={"X-Request-ID": "trace-abc.123"})
    assert response.headers["X-Request-ID"] == "trace-abc.123"


def test_unsafe_request_id_is_replaced(client: TestClient) -> None:
    response = client.get("/health", headers={"X-Request-ID": "bad id with spaces"})
    assert response.headers["X-Request-ID"] != "bad id with spaces"
    assert len(response.headers["X-Request-ID"]) == 32


def test_access_log_is_structured_and_carries_request_id(
    client: TestClient, capsys: pytest.CaptureFixture[str]
) -> None:
    capsys.readouterr()  # drop startup logs
    client.get("/health", headers={"X-Request-ID": "rid-1"})
    records = [json.loads(line) for line in capsys.readouterr().out.splitlines() if line]
    access = [r for r in records if r["event"] == "request.completed"]
    assert len(access) == 1
    assert access[0]["request_id"] == "rid-1"
    assert access[0]["method"] == "GET"
    assert access[0]["path"] == "/health"
    assert access[0]["status_code"] == 200
    assert access[0]["duration_ms"] >= 0


def test_request_id_not_leaked_between_requests(
    client: TestClient, capsys: pytest.CaptureFixture[str]
) -> None:
    client.get("/health", headers={"X-Request-ID": "first"})
    capsys.readouterr()
    client.get("/health", headers={"X-Request-ID": "second"})
    out = capsys.readouterr().out
    assert "first" not in out
    assert "second" in out
