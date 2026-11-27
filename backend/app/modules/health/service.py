"""Health business logic. Readiness checks are pluggable so later milestones (e.g. the
MongoDB layer on Day 5) register themselves without touching this module."""

from collections.abc import Awaitable, Callable, Mapping

import structlog

from app import __version__
from app.modules.health.schemas import HealthResponse, ReadinessResponse

ReadinessCheck = Callable[[], Awaitable[bool]]

_logger = structlog.get_logger(__name__)


def liveness(service_name: str) -> HealthResponse:
    return HealthResponse(service=service_name, version=__version__)


async def readiness(checks: Mapping[str, ReadinessCheck]) -> ReadinessResponse:
    results: dict[str, bool] = {}
    for name, check in checks.items():
        try:
            results[name] = await check()
        except Exception:
            # Never leak dependency errors to clients; log them for operators.
            _logger.warning("readiness.check_error", check=name, exc_info=True)
            results[name] = False
    ok = all(results.values())
    return ReadinessResponse(
        status="ready" if ok else "not_ready",
        checks={name: "ok" if passed else "failed" for name, passed in results.items()},
    )
