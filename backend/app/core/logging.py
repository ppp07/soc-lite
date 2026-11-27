"""Structured logging with structlog, routed through the stdlib logging system.

* JSON lines by default (console renderer for local development).
* Sensitive values are redacted by key name before rendering.
* Control characters in event data are escaped by the JSON renderer, which defends
  against log injection from attacker-controlled input (see docs/security.md §4).
* uvicorn/fastapi stdlib loggers share the same pipeline and format.
"""

import logging
import sys
from collections.abc import Mapping, MutableMapping
from typing import Any

import structlog
from structlog.typing import EventDict, Processor

from app.core.config import LogLevel

REDACTED = "[REDACTED]"
_SENSITIVE_FRAGMENTS = (
    "password",
    "passwd",
    "secret",
    "token",
    "authorization",
    "api_key",
    "apikey",
    "cookie",
)


def _is_sensitive(key: str) -> bool:
    lowered = key.lower()
    return any(fragment in lowered for fragment in _SENSITIVE_FRAGMENTS)


def _redact(value: Any) -> Any:
    if isinstance(value, Mapping):
        return {
            k: REDACTED if isinstance(k, str) and _is_sensitive(k) else _redact(v)
            for k, v in value.items()
        }
    if isinstance(value, list | tuple):
        return [_redact(item) for item in value]
    return value


def redact_sensitive(
    _logger: object, _method: str, event_dict: MutableMapping[str, Any]
) -> EventDict:
    """structlog processor: mask values whose key looks like a credential."""
    return {
        key: REDACTED if _is_sensitive(key) else _redact(value) for key, value in event_dict.items()
    }


class _StdoutHandler(logging.StreamHandler):  # type: ignore[type-arg]
    """StreamHandler that looks up ``sys.stdout`` at emit time (survives stream swaps)."""

    def __init__(self) -> None:
        super().__init__(sys.stdout)

    @property
    def stream(self) -> Any:
        return sys.stdout

    @stream.setter
    def stream(self, _value: Any) -> None:
        pass


def configure_logging(level: LogLevel = LogLevel.INFO, *, json_logs: bool = True) -> None:
    """Configure structlog and stdlib logging. Safe to call more than once."""
    shared_processors: list[Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.StackInfoRenderer(),
        redact_sensitive,
    ]

    renderer: Processor = (
        structlog.processors.JSONRenderer()
        if json_logs
        else structlog.dev.ConsoleRenderer(colors=sys.stderr.isatty())
    )

    structlog.configure(
        processors=[*shared_processors, structlog.stdlib.ProcessorFormatter.wrap_for_formatter],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=False,
    )

    formatter = structlog.stdlib.ProcessorFormatter(
        foreign_pre_chain=shared_processors,
        processors=[
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            structlog.processors.format_exc_info if json_logs else _passthrough,
            renderer,
        ],
    )

    handler = _StdoutHandler()
    handler.setFormatter(formatter)

    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(level.value)

    # Let uvicorn loggers propagate to the root handler; silence its duplicate access log
    # because RequestContextMiddleware emits a structured one.
    for name in ("uvicorn", "uvicorn.error"):
        uv_logger = logging.getLogger(name)
        uv_logger.handlers = []
        uv_logger.propagate = True
    access = logging.getLogger("uvicorn.access")
    access.handlers = []
    access.propagate = False


def _passthrough(_logger: object, _method: str, event_dict: EventDict) -> EventDict:
    return event_dict
