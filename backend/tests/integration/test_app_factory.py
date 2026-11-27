import pytest
from fastapi.testclient import TestClient

from app.core.config import Environment, Settings
from app.main import app_factory, create_app


def test_factory_returns_independent_apps(settings: Settings) -> None:
    assert create_app(settings) is not create_app(settings)


def test_app_factory_uses_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SOC_APP_NAME", "Custom")
    from app.core.config import get_settings

    get_settings.cache_clear()
    try:
        with TestClient(app_factory()) as c:
            assert c.get("/health").json()["service"] == "Custom"
    finally:
        get_settings.cache_clear()


def test_docs_disabled_in_production() -> None:
    prod = Settings(
        _env_file=None,
        environment=Environment.PRODUCTION,
        cors_allowed_origins=["https://example.com"],
    )
    with TestClient(create_app(prod)) as c:
        assert c.get("/docs").status_code == 404
        assert c.get("/openapi.json").status_code == 404
        assert c.get("/health").status_code == 200


def test_docs_available_in_development(client: TestClient) -> None:
    assert client.get("/docs").status_code == 200
