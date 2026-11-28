# 30-Day Roadmap

Each row is one branch and one pull request into `main`. Nothing is merged without
the project owner's approval. Every milestone ships with tests and docs updates.

Legend: ☐ planned · ◐ in progress (implemented, awaiting merge) · ☑ merged

## Week 1: Foundation

| Day | Branch | Deliverable | Status |
|---|---|---|---|
| 1 | `docs/architecture` | Architecture, schema, API, security, MITRE, simulation, frontend docs; ADRs; README; PR template; `.gitignore` hardening; repo description | ◐ |
| 2 | `chore/backend-scaffold` | FastAPI app factory, settings, structured logging, problem+json errors, `/health`, pytest, ruff, mypy, uv | ◐ |
| 3 | `feat/frontend-foundation` | Vite + React + TS + Tailwind design tokens (light editorial theme), routing, layout shell, base UI, API client (React Query + Zod), sample-data dashboard, ESLint/Prettier, Vitest | ◐ |
| 4 | `chore/docker-ci` | docker-compose (Mongo with auth), GitHub Actions CI, gitleaks, pip-audit, npm audit, Dependabot; **enable branch protection once CI passes** | ☐ |
| 5 | `feat/db-layer` | Mongo client (PyMongo async), index bootstrap, repository base, test fixtures | ☐ |
| 6–7 | `feat/auth` | Users, Argon2id, JWT + rotating refresh, RBAC, rate limiting, lockout, **audit module**, security tests | ☐ |

## Week 2: Data pipeline

| Day | Branch | Deliverable | Status |
|---|---|---|---|
| 8 | `feat/frontend-auth` | Login page, in-memory token, silent refresh, protected routes | ☐ |
| 9–10 | `feat/simulator` | Seeded baseline + attack scenarios, datasets, CLI | ☐ |
| 11 | `feat/ingestion` | HTTP ingest (API keys), event bus, file + syslog collectors | ☐ |
| 12–13 | `feat/parsing` | Parsers, normalizer, geo enrichment, parse-failure handling | ☐ |
| 14 | `feat/events-api` | Event search API + Events page | ☐ |

## Week 3: Detection, alerts and incidents

| Day | Branch | Deliverable | Status |
|---|---|---|---|
| 15–16 | `feat/detection-engine` | Rule interface, sliding windows, rule config, **MITRE mapping module** | ☐ |
| 17 | `feat/brute-force-rules` | Classic, spraying, distributed (T1110.x) | ☐ |
| 18 | `feat/suspicious-login-rules` | Impossible travel, new country, off-hours, success-after-failures (T1078) | ☐ |
| 19–20 | `feat/alerts` | Dedup, lifecycle, API, Alerts UI with severity + MITRE badges | ☐ |
| 21 | `feat/incidents` | Incident API, auto-grouping, timeline, Incidents UI | ☐ |

## Week 4: Dashboard, response, ML, finish

| Day | Branch | Deliverable | Status |
|---|---|---|---|
| 22 | `feat/realtime` | WebSocket tickets, topic fan-out, `useRealtime` hook | ☐ |
| 23–24 | `feat/dashboard` | Aggregations + live SOC dashboard replacing Day 3 sample data (KPIs, charts, MITRE heatmap, live feed) | ☐ |
| 25–26 | `feat/response` | Playbooks, simulated actions, approval/revert, blocklist, safety tests | ☐ |
| 27–28 | `feat/ml-anomaly` | Features, IsolationForest, registry with SHA-256 verification, ML UI | ☐ |
| 29 | `chore/hardening` | Security headers, audit UI, end-to-end scenario tests, security test pass | ☐ |
| 30 | `docs/release-v1` | Installation guide, screenshots, demo script, final API docs, `v1.0.0` tag | ☐ |

## Cross-cutting (every PR)

- Unit tests for new logic; integration tests for new endpoints.
- Audit events for any new security-relevant action.
- Docs updated alongside code.
- No secrets, credentials or `.env` files committed.
