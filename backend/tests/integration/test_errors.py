import re

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import BaseModel, ConfigDict, Field

from app.core.config import Settings
from app.core.errors import (
    ConflictError,
    NotFoundError,
    PermissionDeniedError,
    ValidationFailedError,
)
from app.main import create_app


class Payload(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=10)


@pytest.fixture
def error_app(settings: Settings) -> FastAPI:
    """App with extra routes that exercise every error path."""
    app = create_app(settings)

    @app.get("/_t/not-found")
    async def _nf() -> None:
        raise NotFoundError("alert 42 does not exist")

    @app.get("/_t/conflict")
    async def _c() -> None:
        raise ConflictError()

    @app.get("/_t/forbidden")
    async def _f() -> None:
        raise PermissionDeniedError()

    @app.get("/_t/invalid")
    async def _v() -> None:
        raise ValidationFailedError("bad state")

    @app.get("/_t/boom")
    async def _boom() -> None:
        raise RuntimeError("db password is hunter2 at /srv/app/secret.py")

    @app.post("/_t/payload")
    async def _p(payload: Payload) -> Payload:
        return payload

    return app


@pytest.fixture
def ec(error_app: FastAPI) -> TestClient:
    return TestClient(error_app, raise_server_exceptions=False)


@pytest.mark.parametrize(
    ("path", "status", "slug"),
    [
        ("/_t/not-found", 404, "not-found"),
        ("/_t/conflict", 409, "conflict"),
        ("/_t/forbidden", 403, "permission-denied"),
        ("/_t/invalid", 422, "validation-error"),
    ],
)
def test_domain_errors_map_to_problem_json(
    ec: TestClient, path: str, status: int, slug: str
) -> None:
    response = ec.get(path)
    assert response.status_code == status
    assert response.headers["content-type"].startswith("application/problem+json")
    body = response.json()
    assert body["type"] == f"https://soc-lite.local/problems/{slug}"
    assert body["status"] == status
    assert body["instance"] == path
    assert body["request_id"] == response.headers["X-Request-ID"]


def test_domain_error_detail_included(ec: TestClient) -> None:
    assert ec.get("/_t/not-found").json()["detail"] == "alert 42 does not exist"


def test_unknown_route_is_problem_json_404(ec: TestClient) -> None:
    response = ec.get("/nope")
    assert response.status_code == 404
    body = response.json()
    assert body["type"].endswith("/not-found")
    assert body["title"] == "Not Found"


def test_unhandled_exception_is_generic_500(ec: TestClient) -> None:
    response = ec.get("/_t/boom")
    assert response.status_code == 500
    assert response.headers["content-type"].startswith("application/problem+json")
    body = response.json()
    assert body["type"].endswith("/internal-error")
    assert "hunter2" not in response.text
    assert "secret.py" not in response.text
    assert "Traceback" not in response.text
    assert body["request_id"] == response.headers["X-Request-ID"]


def test_request_validation_error_shape_and_no_input_echo(ec: TestClient) -> None:
    response = ec.post("/_t/payload", json={"name": "x" * 50, "extra": "SENSITIVE-VALUE"})
    assert response.status_code == 422
    body = response.json()
    assert body["type"].endswith("/validation-error")
    assert body["errors"]
    assert all(set(e) == {"loc", "msg"} for e in body["errors"])
    assert "SENSITIVE-VALUE" not in response.text
    assert "x" * 50 not in response.text


def test_unknown_fields_rejected(ec: TestClient) -> None:
    response = ec.post("/_t/payload", json={"name": "ok", "role": "admin"})
    assert response.status_code == 422


def test_malformed_json_is_422(ec: TestClient) -> None:
    response = ec.post(
        "/_t/payload", content=b"{not json", headers={"Content-Type": "application/json"}
    )
    assert response.status_code == 422
    assert response.headers["content-type"].startswith("application/problem+json")


def test_unhandled_exception_is_logged_server_side(
    ec: TestClient, capsys: pytest.CaptureFixture[str]
) -> None:
    ec.get("/_t/boom")
    out = capsys.readouterr().out
    assert "request.unhandled_exception" in out
    assert re.search(r'"request_id": "[0-9a-f]{32}"', out) or "request_id" in out
