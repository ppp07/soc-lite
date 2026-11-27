"""Environment-based application configuration (pydantic-settings).

All settings are read from ``SOC_*`` environment variables (or a local, git-ignored
``.env`` file). Secrets must never have defaults committed to the repository.
"""

from enum import StrEnum
from functools import lru_cache
from typing import Annotated, Self
from urllib.parse import urlsplit

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Environment(StrEnum):
    DEVELOPMENT = "development"
    TEST = "test"
    PRODUCTION = "production"


class LogLevel(StrEnum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


def _normalize_origin(origin: str) -> str:
    """Validate a CORS origin (scheme + host[:port], no path) and normalize it."""
    value = origin.strip().rstrip("/")
    if value == "*":
        msg = "wildcard CORS origin '*' is not allowed; list explicit origins"
        raise ValueError(msg)
    parts = urlsplit(value)
    if parts.scheme not in {"http", "https"} or not parts.hostname:
        msg = f"invalid CORS origin {origin!r}: expected e.g. http://localhost:5173"
        raise ValueError(msg)
    if parts.path or parts.query or parts.fragment or parts.username or parts.password:
        msg = f"invalid CORS origin {origin!r}: must not contain a path, query or credentials"
        raise ValueError(msg)
    return f"{parts.scheme}://{parts.netloc}".lower()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="SOC_",
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "SOC-Lite"
    environment: Environment = Environment.DEVELOPMENT
    debug: bool = False

    api_v1_prefix: str = "/api/v1"

    log_level: LogLevel = LogLevel.INFO
    # JSON lines for machines; human-friendly console output when False.
    log_json: bool = True

    # Origins allowed to call the API from a browser (the SPA). Comma-separated in env.
    cors_allowed_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["http://localhost:5173"]
    )
    cors_max_age_seconds: int = Field(default=600, ge=0, le=86400)

    @field_validator("cors_allowed_origins", mode="before")
    @classmethod
    def _split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [item for item in (part.strip() for part in value.split(",")) if item]
        return value

    @field_validator("cors_allowed_origins")
    @classmethod
    def _validate_origins(cls, value: list[str]) -> list[str]:
        return [_normalize_origin(origin) for origin in value]

    @field_validator("api_v1_prefix")
    @classmethod
    def _validate_prefix(cls, value: str) -> str:
        if not value.startswith("/") or value.endswith("/"):
            msg = "api_v1_prefix must start with '/' and must not end with '/'"
            raise ValueError(msg)
        return value

    @model_validator(mode="after")
    def _production_guards(self) -> Self:
        if self.environment is Environment.PRODUCTION:
            if self.debug:
                msg = "SOC_DEBUG must be false in production"
                raise ValueError(msg)
            insecure = [o for o in self.cors_allowed_origins if not o.startswith("https://")]
            if insecure:
                msg = f"production CORS origins must use https: {insecure}"
                raise ValueError(msg)
        return self

    @property
    def is_production(self) -> bool:
        return self.environment is Environment.PRODUCTION


@lru_cache
def get_settings() -> Settings:
    return Settings()
