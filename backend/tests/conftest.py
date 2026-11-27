from collections.abc import Iterator

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.config import Environment, Settings
from app.main import create_app


@pytest.fixture(autouse=True)
def _clean_env(monkeypatch: pytest.MonkeyPatch) -> None:
    """Keep the developer's shell environment out of tests."""
    import os

    for key in list(os.environ):
        if key.startswith("SOC_"):
            monkeypatch.delenv(key)


@pytest.fixture
def settings() -> Settings:
    return Settings(
        _env_file=None,
        environment=Environment.TEST,
        log_json=True,
        cors_allowed_origins=["http://localhost:5173"],
    )


@pytest.fixture
def app(settings: Settings) -> FastAPI:
    return create_app(settings)


@pytest.fixture
def client(app: FastAPI) -> Iterator[TestClient]:
    # raise_server_exceptions=False so we can assert on the real 500 response.
    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client
