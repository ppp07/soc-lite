from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response, status

from app.core.config import Settings
from app.core.deps import get_app_settings
from app.modules.health import service
from app.modules.health.schemas import HealthResponse, ReadinessResponse

# Unversioned probes for orchestrators / load balancers. Public by design.
system_router = APIRouter(tags=["system"])
# Versioned API health, mounted under /api/v1.
v1_router = APIRouter(tags=["system"])


@system_router.get("/health", response_model=HealthResponse, summary="Liveness probe")
@v1_router.get("/health", response_model=HealthResponse, summary="API health")
async def health(settings: Annotated[Settings, Depends(get_app_settings)]) -> HealthResponse:
    return service.liveness(settings.app_name)


@system_router.get(
    "/ready",
    response_model=ReadinessResponse,
    responses={status.HTTP_503_SERVICE_UNAVAILABLE: {"model": ReadinessResponse}},
    summary="Readiness probe",
)
async def ready(request: Request, response: Response) -> ReadinessResponse:
    result = await service.readiness(request.app.state.readiness_checks)
    if result.status != "ready":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return result
