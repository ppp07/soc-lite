# API Design

> Status: **Approved design (Day 1)**. Once implemented, the live OpenAPI spec is served at
> `/docs` (Swagger UI) and `/openapi.json`. This document describes intent and conventions;
> the OpenAPI spec is the source of truth for exact schemas.

Base path: `/api/v1`

## Conventions

| Topic | Convention |
|---|---|
| Format | JSON; `snake_case` fields |
| Time | ISO-8601 UTC (`2026-11-26T10:00:00Z`) |
| IDs | string (`ObjectId` hex) |
| Auth | `Authorization: Bearer <access_token>`; ingest uses `X-API-Key` |
| Pagination | cursor-based: `?limit=50&cursor=<opaque>` → `{items, next_cursor}`; `limit` max 200 |
| Sorting | `?sort=-created_at` (allow-listed fields only) |
| Errors | RFC 7807 `application/problem+json` |
| Request ID | `X-Request-ID` echoed or generated; included in errors and audit logs |
| Versioning | URL prefix `/api/v1` |

### Error format

```json
{
  "type": "https://soc-lite.local/problems/validation-error",
  "title": "Validation failed",
  "status": 422,
  "detail": "limit must be <= 200",
  "instance": "/api/v1/alerts",
  "request_id": "01JD…",
  "errors": [{"loc": ["query", "limit"], "msg": "must be <= 200"}]
}
```

## Roles

| Role | Can |
|---|---|
| `viewer` | read dashboard, events, alerts, incidents, rules |
| `analyst` | viewer + update alerts/incidents, approve/revert response actions, run ML scoring |
| `admin` | analyst + manage users, API keys, rules, playbooks, ML training, simulator, audit log |

## Endpoints

### System

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | public | liveness |
| GET | `/ready` | public | readiness (registered dependency checks pass; `503` otherwise). Reports no checks until the DB layer lands (Day 5) |
| GET | `/api/v1/health` | public | API health under the versioned prefix |

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | public (rate-limited) | username/password → access token (body) + refresh cookie |
| POST | `/auth/refresh` | refresh cookie | rotate refresh token, new access token |
| POST | `/auth/logout` | any | revoke refresh token family |
| GET | `/auth/me` | any | current user profile |

### Users & API keys

| Method | Path | Auth |
|---|---|---|
| GET, POST | `/users` | admin |
| GET, PATCH, DELETE | `/users/{id}` | admin |
| GET, POST | `/api-keys` | admin (key value returned **once** on create) |
| DELETE | `/api-keys/{id}` | admin |

### Ingestion

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/ingest/logs` | API key (`ingest:write`) | batch of raw lines or JSON events; size-limited |
| GET | `/ingest/sources` | analyst | configured collectors + status |
| GET | `/ingest/stats` | analyst | throughput, parse failures |

### Events

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/events` | viewer | filters: `from`, `to`, `source_ip`, `user`, `category`, `outcome`, `q` |
| GET | `/events/{id}` | viewer | includes raw log reference |

### Detection rules

| Method | Path | Auth |
|---|---|---|
| GET | `/rules` | viewer |
| GET | `/rules/{key}` | viewer |
| PATCH | `/rules/{key}` | admin (enable/disable, params validated per rule) |

### Alerts

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/alerts` | viewer | filters: `status`, `severity`, `rule_key`, `technique_id`, `ip`, `user`, time |
| GET | `/alerts/{id}` | viewer | with evidence events and MITRE context |
| PATCH | `/alerts/{id}` | analyst | status, assignee (state machine enforced) |
| POST | `/alerts/{id}/comments` | analyst | |
| POST | `/alerts/bulk` | analyst | bulk status/assign |

### Incidents

| Method | Path | Auth |
|---|---|---|
| GET, POST | `/incidents` | viewer / analyst |
| GET, PATCH | `/incidents/{id}` | viewer / analyst |
| POST | `/incidents/{id}/alerts` | analyst |
| POST | `/incidents/{id}/timeline` | analyst |

### Response (simulated)

| Method | Path | Auth |
|---|---|---|
| GET, POST | `/playbooks` | analyst / admin |
| PATCH, DELETE | `/playbooks/{id}` | admin |
| GET | `/response/actions` | analyst |
| POST | `/response/actions/{id}/approve` | analyst |
| POST | `/response/actions/{id}/reject` | analyst |
| POST | `/response/actions/{id}/revert` | analyst |
| GET | `/blocklist` | analyst |
| DELETE | `/blocklist/{id}` | analyst |

### Machine learning

| Method | Path | Auth |
|---|---|---|
| GET | `/ml/models` | viewer |
| POST | `/ml/train` | admin (async job) |
| POST | `/ml/models/{id}/activate` | admin |
| POST | `/ml/score` | analyst (score a feature vector, for testing) |

### Dashboard

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/dashboard/summary` | viewer | KPI tiles |
| GET | `/dashboard/timeseries` | viewer | `metric`, `interval`, `from`, `to` |
| GET | `/dashboard/top` | viewer | `field` ∈ {source_ip, user, rule, technique}, `limit` |
| GET | `/dashboard/mitre` | viewer | alert counts per tactic/technique (heatmap) |

### Simulator (development only)

Disabled unless `SOC_ENV=development` **and** the user is admin.

| Method | Path |
|---|---|
| GET | `/simulator/scenarios` |
| POST | `/simulator/run` (`scenario`, `seed`, `speed`) |
| POST | `/simulator/stop` |

### Audit

| Method | Path | Auth |
|---|---|---|
| GET | `/audit` | admin (filters: actor, action, outcome, time) |

### Realtime

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/realtime/ticket` | viewer | short-lived, single-use WebSocket ticket |

## Realtime: `WS /ws/stream`

1. Client obtains a short-lived (60 s), single-use WebSocket ticket from
   `POST /api/v1/realtime/ticket` (authenticated).
2. Client connects to `/ws/stream?ticket=…&topics=alerts,events,incidents,response`.
3. Server messages:

```json
{"topic": "alerts", "type": "alert.created", "ts": "…", "data": { "id": "…", "severity": "high", "…": "…" }}
```

Tickets are used instead of putting the JWT in the URL, so the token doesn't end up in proxy or server access logs.
