import json

import pytest
import structlog

from app.core.config import LogLevel
from app.core.logging import REDACTED, configure_logging, redact_sensitive


def test_redacts_sensitive_keys_recursively() -> None:
    out = redact_sensitive(
        None,
        "info",
        {
            "event": "login",
            "password": "hunter2",
            "Authorization": "Bearer abc",
            "user": "alice",
            "nested": {"api_key": "k", "ok": 1},
            "items": [{"refresh_token": "t"}],
        },
    )
    assert out["password"] == REDACTED
    assert out["Authorization"] == REDACTED
    assert out["user"] == "alice"
    assert out["nested"] == {"api_key": REDACTED, "ok": 1}
    assert out["items"] == [{"refresh_token": REDACTED}]


def test_json_output_is_structured_and_escapes_control_chars(
    capsys: pytest.CaptureFixture[str],
) -> None:
    configure_logging(LogLevel.INFO, json_logs=True)
    fields = {"username": "bob\nFAKE LOG LINE", "password": "value-to-be-masked"}
    structlog.get_logger("test").info("evt", **fields)
    lines = capsys.readouterr().out.strip().splitlines()
    assert len(lines) == 1  # injected newline did not create a second log line
    record = json.loads(lines[0])
    assert record["event"] == "evt"
    assert record["level"] == "info"
    assert record["username"] == "bob\nFAKE LOG LINE"
    assert record["password"] == REDACTED
    assert "timestamp" in record


def test_level_filtering(capsys: pytest.CaptureFixture[str]) -> None:
    configure_logging(LogLevel.WARNING, json_logs=True)
    log = structlog.get_logger("test")
    log.info("hidden")
    log.warning("shown")
    out = capsys.readouterr().out
    assert "shown" in out
    assert "hidden" not in out


def test_console_mode_does_not_crash(capsys: pytest.CaptureFixture[str]) -> None:
    configure_logging(LogLevel.INFO, json_logs=False)
    structlog.get_logger("test").info("hello", k="v")
    assert "hello" in capsys.readouterr().out
