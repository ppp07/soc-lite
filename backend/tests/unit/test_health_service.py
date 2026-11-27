import pytest

from app import __version__
from app.modules.health import service


def test_liveness() -> None:
    result = service.liveness("SOC-Lite")
    assert result.status == "ok"
    assert result.version == __version__


@pytest.mark.anyio
async def test_readiness_with_no_checks_is_ready() -> None:
    result = await service.readiness({})
    assert result.status == "ready"
    assert result.checks == {}


@pytest.mark.anyio
async def test_readiness_failing_check() -> None:
    async def good() -> bool:
        return True

    async def bad() -> bool:
        return False

    result = await service.readiness({"good": good, "bad": bad})
    assert result.status == "not_ready"
    assert result.checks == {"good": "ok", "bad": "failed"}


@pytest.mark.anyio
async def test_readiness_check_exception_is_contained() -> None:
    async def boom() -> bool:
        raise RuntimeError("secret connection string")

    result = await service.readiness({"db": boom})
    assert result.status == "not_ready"
    assert result.checks == {"db": "failed"}
