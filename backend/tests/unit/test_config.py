from typing import Any

import pytest
from pydantic import ValidationError

from app.core.config import Environment, LogLevel, Settings


def make(**kwargs: Any) -> Settings:
    return Settings(_env_file=None, **kwargs)


def test_defaults_are_safe() -> None:
    s = make()
    assert s.environment is Environment.DEVELOPMENT
    assert s.debug is False
    assert s.log_level is LogLevel.INFO
    assert s.cors_allowed_origins == ["http://localhost:5173"]


def test_reads_prefixed_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SOC_ENVIRONMENT", "test")
    monkeypatch.setenv("SOC_LOG_LEVEL", "DEBUG")
    monkeypatch.setenv("SOC_LOG_JSON", "false")
    s = make()
    assert s.environment is Environment.TEST
    assert s.log_level is LogLevel.DEBUG
    assert s.log_json is False


def test_origins_parsed_from_comma_separated_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv(
        "SOC_CORS_ALLOWED_ORIGINS", "http://localhost:5173, https://App.Example.com/"
    )
    assert make().cors_allowed_origins == ["http://localhost:5173", "https://app.example.com"]


@pytest.mark.parametrize(
    "origin",
    [
        "*",
        "localhost:5173",
        "ftp://example.com",
        "http://example.com/path",
        "http://u:p@example.com",
    ],
)
def test_invalid_origins_rejected(origin: str) -> None:
    with pytest.raises(ValidationError):
        make(cors_allowed_origins=[origin])


@pytest.mark.parametrize("prefix", ["api/v1", "/api/v1/"])
def test_invalid_api_prefix_rejected(prefix: str) -> None:
    with pytest.raises(ValidationError):
        make(api_v1_prefix=prefix)


def test_production_requires_https_origins() -> None:
    with pytest.raises(ValidationError, match="https"):
        make(environment="production", cors_allowed_origins=["http://example.com"])


def test_production_rejects_debug() -> None:
    with pytest.raises(ValidationError, match="DEBUG"):
        make(environment="production", debug=True, cors_allowed_origins=["https://example.com"])


def test_production_valid() -> None:
    s = make(environment="production", cors_allowed_origins=["https://example.com"])
    assert s.is_production
