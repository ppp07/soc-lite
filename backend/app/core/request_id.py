"""Request ID generation/validation and the ASGI middleware that applies it."""

import re
import time
import uuid

import structlog
from starlette.datastructures import MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

REQUEST_ID_HEADER = "X-Request-ID"

# Only echo client-supplied IDs that are short and boring: prevents log injection and
# header abuse. Anything else is replaced by a server-generated ID.
_VALID_REQUEST_ID = re.compile(r"^[A-Za-z0-9._-]{1,64}$")

_logger = structlog.get_logger("app.access")


def new_request_id() -> str:
    return uuid.uuid4().hex


def resolve_request_id(candidate: str | None) -> str:
    if candidate is not None and _VALID_REQUEST_ID.fullmatch(candidate):
        return candidate
    return new_request_id()


def get_request_id(scope: Scope) -> str | None:
    state = scope.get("state")
    if isinstance(state, dict):
        value = state.get("request_id")
        return value if isinstance(value, str) else None
    return None


class RequestContextMiddleware:
    """Assigns a request ID, binds it to the log context and emits an access log line.

    Implemented as pure ASGI middleware (not ``BaseHTTPMiddleware``) so context
    variables propagate correctly and streaming responses are not buffered.
    """

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        raw = MutableHeaders(scope=scope).get(REQUEST_ID_HEADER)
        request_id = resolve_request_id(raw)
        scope.setdefault("state", {})["request_id"] = request_id

        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(request_id=request_id)

        status_code = 500
        started = time.perf_counter()

        async def send_wrapper(message: Message) -> None:
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message["status"]
                headers = MutableHeaders(scope=message)
                headers[REQUEST_ID_HEADER] = request_id
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        finally:
            _logger.info(
                "request.completed",
                method=scope["method"],
                path=scope["path"],
                status_code=status_code,
                duration_ms=round((time.perf_counter() - started) * 1000, 2),
            )
            structlog.contextvars.clear_contextvars()
