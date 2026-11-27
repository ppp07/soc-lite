# SOC-Lite Backend

FastAPI modular monolith (see [ADR-0001](../docs/adr/0001-modular-monolith.md) and
[architecture](../docs/architecture.md)). **Day 2 scope:** application scaffold only. There is no
database, authentication or detection logic yet; those arrive in later milestones
([roadmap](../docs/roadmap.md)).

Stack: Python 3.12+, FastAPI, Uvicorn, Pydantic v2, pydantic-settings, structlog, managed with
[uv](https://docs.astral.sh/uv/). Quality tools: pytest, Ruff, MyPy (strict).

## Quick start

```bash
cd backend
uv sync                                   # create .venv and install locked deps
cp ../.env.example ../.env                # optional; defaults work for local dev
uv run uvicorn app.main:app_factory --factory --reload
```

Then open <http://localhost:8000/health> (and `/docs` in non-production environments).

## Quality checks

```bash
uv run pytest --cov            # tests + coverage
uv run ruff check .            # lint
uv run ruff format --check .   # formatting (drop --check to apply)
uv run mypy                    # strict type checking
```

## Layout

```
backend/
├── app/
│   ├── main.py             # create_app() factory: settings, logging, CORS, errors, routers
│   ├── core/
│   │   ├── config.py       # Settings (pydantic-settings, SOC_* env vars)
│   │   ├── logging.py      # structlog + stdlib integration, redaction
│   │   ├── request_id.py   # X-Request-ID handling + access-log middleware
│   │   ├── errors.py       # domain errors + RFC 7807 handlers
│   │   └── deps.py         # shared FastAPI dependencies
│   ├── common/             # (reserved) event bus, pagination, shared types
│   └── modules/
│       └── health/         # router.py / service.py / schemas.py
└── tests/
    ├── unit/               # no app/server needed
    └── integration/        # full ASGI app via httpx TestClient
```

New feature modules follow the layering in
[architecture §5.1](../docs/architecture.md#51-layering): `router.py`, `service.py`,
`repository.py`, `schemas.py`, `deps.py`. Routers contain no business logic.

## Configuration

All settings are environment variables prefixed `SOC_` (read from the process environment, then
`.env` in `backend/` or the repo root). `../.env.example` documents each one with placeholders.

| Variable | Default | Notes |
|---|---|---|
| `SOC_ENVIRONMENT` | `development` | `development` \| `test` \| `production` |
| `SOC_DEBUG` | `false` | Must be `false` in production |
| `SOC_LOG_LEVEL` | `INFO` | `DEBUG`…`CRITICAL` |
| `SOC_LOG_JSON` | `true` | `false` for human-friendly console output |
| `SOC_API_V1_PREFIX` | `/api/v1` | |
| `SOC_CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated exact origins; `*` is rejected; `https` required in production |
| `SOC_CORS_MAX_AGE_SECONDS` | `600` | Preflight cache |

Invalid configuration fails fast at startup. Secrets will be added here as they are introduced and
will never have committed defaults ([security §6](../docs/security.md#6-secrets-management)).

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | public | Liveness: `{"status":"ok","service":…,"version":…}` |
| GET | `/ready` | public | Readiness: `200` + `{"status":"ready","checks":{…}}`, or `503` when any registered check fails |
| GET | `/api/v1/health` | public | Same payload as `/health`, under the versioned API prefix |

`/ready` runs checks registered in `app.state.readiness_checks` (`name -> async () -> bool`).
With no dependencies yet it reports ready with no checks; the MongoDB layer (Day 5) registers its
ping there. Check exceptions are logged, never returned to clients.

> Authentication is not implemented yet. The health endpoints are intentionally public; every other
> route added from Day 6 onward must require authentication by default.

## Error handling

All errors are RFC 7807 `application/problem+json` (shape in [api.md](../docs/api.md)):

```json
{
  "type": "https://soc-lite.local/problems/not-found",
  "title": "Resource not found",
  "status": 404,
  "detail": "alert 42 does not exist",
  "instance": "/api/v1/alerts/42",
  "request_id": "9f1c…"
}
```

- Services raise `NotFoundError`, `ConflictError`, `PermissionDeniedError` or
  `ValidationFailedError` (`app/core/errors.py`); a central handler maps them to HTTP.
- Request validation errors return only `loc` + `msg` per error; submitted values are never echoed.
- Unexpected exceptions return a generic 500 and are logged server-side with the request ID. No
  stack traces or internals reach clients.

## Logging and request IDs

- structlog JSON lines to stdout (console renderer when `SOC_LOG_JSON=false`); uvicorn's own
  loggers share the same pipeline.
- Every request gets an `X-Request-ID`: a client-supplied value is echoed only if it matches
  `[A-Za-z0-9._-]{1,64}`, otherwise a new one is generated. It is bound to all log lines of the
  request, returned in the response header and included in error bodies.
- One `request.completed` access log line per request (method, path, status, duration).
- Values under keys containing `password`, `secret`, `token`, `authorization`, `api_key` or
  `cookie` are redacted. The JSON renderer escapes control characters, so attacker-controlled
  text cannot forge log lines.

## CORS

Only the origins in `SOC_CORS_ALLOWED_ORIGINS` are allowed (credentials are permitted only for
them; never `*`). Methods and headers are explicit allow-lists
(`Authorization`, `Content-Type`, `X-Request-ID`); `X-Request-ID` is exposed to browsers.
