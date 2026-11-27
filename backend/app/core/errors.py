"""Domain errors and central RFC 7807 (``application/problem+json``) handlers.

Services raise ``AppError`` subclasses; handlers translate them to HTTP. Unexpected
exceptions are logged server-side and returned as a generic 500 with no internals.
"""

from http import HTTPStatus
from typing import Any

import structlog
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.request_id import REQUEST_ID_HEADER, get_request_id, new_request_id

PROBLEM_JSON = "application/problem+json"
PROBLEM_BASE_URI = "https://soc-lite.local/problems"

_logger = structlog.get_logger(__name__)


class ProblemDetail(BaseModel):
    """RFC 7807 problem document (see docs/api.md, "Error format")."""

    type: str
    title: str
    status: int
    detail: str | None = None
    instance: str
    request_id: str
    errors: list[dict[str, Any]] | None = None


class AppError(Exception):
    """Base class for domain errors raised by services."""

    status_code: int = HTTPStatus.INTERNAL_SERVER_ERROR
    problem_slug: str = "internal-error"
    title: str = "Internal server error"

    def __init__(self, detail: str | None = None) -> None:
        super().__init__(detail or self.title)
        self.detail = detail


class NotFoundError(AppError):
    status_code = HTTPStatus.NOT_FOUND
    problem_slug = "not-found"
    title = "Resource not found"


class ConflictError(AppError):
    status_code = HTTPStatus.CONFLICT
    problem_slug = "conflict"
    title = "Conflict"


class PermissionDeniedError(AppError):
    status_code = HTTPStatus.FORBIDDEN
    problem_slug = "permission-denied"
    title = "Permission denied"


class ValidationFailedError(AppError):
    status_code = HTTPStatus.UNPROCESSABLE_ENTITY
    problem_slug = "validation-error"
    title = "Validation failed"


def problem_response(
    request: Request,
    *,
    status_code: int,
    slug: str,
    title: str,
    detail: str | None = None,
    errors: list[dict[str, Any]] | None = None,
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    request_id = get_request_id(request.scope) or new_request_id()
    body = ProblemDetail(
        type=f"{PROBLEM_BASE_URI}/{slug}",
        title=title,
        status=status_code,
        detail=detail,
        instance=request.url.path,
        request_id=request_id,
        errors=errors,
    )
    # The request-ID header is set here as well because responses produced by the outermost
    # error middleware (unhandled exceptions) do not pass back through our middleware.
    return JSONResponse(
        status_code=status_code,
        content=body.model_dump(exclude_none=True),
        media_type=PROBLEM_JSON,
        headers={**(headers or {}), REQUEST_ID_HEADER: request_id},
    )


async def _handle_app_error(request: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, AppError)  # noqa: S101 - narrowing for the type checker
    return problem_response(
        request,
        status_code=exc.status_code,
        slug=exc.problem_slug,
        title=exc.title,
        detail=exc.detail,
    )


async def _handle_http_exception(request: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, StarletteHTTPException)  # noqa: S101
    try:
        phrase = HTTPStatus(exc.status_code).phrase
    except ValueError:
        phrase = "Error"
    slug = phrase.lower().replace(" ", "-")
    return problem_response(
        request,
        status_code=exc.status_code,
        slug=slug,
        title=phrase,
        detail=exc.detail if isinstance(exc.detail, str) and exc.detail != phrase else None,
        headers=dict(exc.headers) if exc.headers else None,
    )


async def _handle_validation_error(request: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, RequestValidationError)  # noqa: S101
    # Only location and message are returned; submitted input values are never echoed.
    errors = [{"loc": list(err["loc"]), "msg": err["msg"]} for err in exc.errors()]
    first = errors[0]["msg"] if errors else None
    return problem_response(
        request,
        status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
        slug="validation-error",
        title="Validation failed",
        detail=first,
        errors=errors,
    )


async def _handle_unexpected(request: Request, exc: Exception) -> JSONResponse:
    _logger.error(
        "request.unhandled_exception",
        method=request.method,
        path=request.url.path,
        exc_info=exc,
    )
    return problem_response(
        request,
        status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
        slug="internal-error",
        title="Internal server error",
        detail="An unexpected error occurred.",
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, _handle_app_error)
    app.add_exception_handler(StarletteHTTPException, _handle_http_exception)
    app.add_exception_handler(RequestValidationError, _handle_validation_error)
    app.add_exception_handler(Exception, _handle_unexpected)
