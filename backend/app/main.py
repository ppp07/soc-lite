"""Application factory."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import structlog
from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.core.config import Settings, get_settings
from app.core.errors import register_exception_handlers
from app.core.logging import configure_logging
from app.core.request_id import REQUEST_ID_HEADER, RequestContextMiddleware
from app.modules.health.router import system_router, v1_router
from app.modules.health.service import ReadinessCheck

CORS_ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
CORS_ALLOWED_HEADERS = ["Authorization", "Content-Type", REQUEST_ID_HEADER]


def create_app(settings: Settings | None = None) -> FastAPI:
    """Build the FastAPI app. Pass ``settings`` explicitly in tests."""
    settings = settings or get_settings()
    configure_logging(settings.log_level, json_logs=settings.log_json)
    logger = structlog.get_logger(__name__)

    @asynccontextmanager
    async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
        logger.info(
            "app.startup",
            app=settings.app_name,
            version=__version__,
            environment=settings.environment.value,
        )
        yield
        logger.info("app.shutdown")

    app = FastAPI(
        title=settings.app_name,
        version=__version__,
        debug=settings.debug,
        lifespan=lifespan,
        # Interactive docs are a development convenience only.
        docs_url=None if settings.is_production else "/docs",
        redoc_url=None,
        openapi_url=None if settings.is_production else "/openapi.json",
    )
    app.state.settings = settings
    # name -> async check; later milestones (DB layer) register here.
    readiness_checks: dict[str, ReadinessCheck] = {}
    app.state.readiness_checks = readiness_checks

    register_exception_handlers(app)

    # Middleware order: the last added is outermost. CORS must be outermost so that
    # preflight and error responses carry CORS headers; request context wraps the rest.
    app.add_middleware(RequestContextMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allowed_origins,
        allow_credentials=True,  # safe: origins are an explicit allow-list, never "*"
        allow_methods=CORS_ALLOWED_METHODS,
        allow_headers=CORS_ALLOWED_HEADERS,
        expose_headers=[REQUEST_ID_HEADER],
        max_age=settings.cors_max_age_seconds,
    )

    app.include_router(system_router)
    api_v1 = APIRouter(prefix=settings.api_v1_prefix)
    api_v1.include_router(v1_router)
    app.include_router(api_v1)

    return app


def app_factory() -> FastAPI:
    """Zero-arg factory for ``uvicorn app.main:app_factory --factory``."""
    return create_app()
