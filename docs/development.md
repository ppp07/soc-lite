# Developer Guide

> Status: **Day 3**. Backend and frontend setup commands are available; Docker and CI arrive on Day 4.

## Prerequisites

| Tool | Purpose |
|---|---|
| Git, GitHub CLI (`gh`) | version control, PRs |
| Docker + Docker Compose | MongoDB and full-stack runs |
| Python 3.12+ and [uv](https://docs.astral.sh/uv/) | backend |
| Node.js ≥ 22.22 + npm | frontend (`engines` in `frontend/package.json`) |

## Backend quick start

```bash
cd backend
uv sync                                                   # install locked dependencies
uv run uvicorn app.main:app_factory --factory --reload    # http://localhost:8000/health
uv run pytest --cov                                       # tests
uv run ruff check . && uv run ruff format --check .       # lint + format
uv run mypy                                               # strict type check
```

Configuration is via `SOC_*` environment variables; copy `.env.example` to `.env` (git-ignored).
See [backend/README.md](../backend/README.md) for layout, configuration, error format and logging.

## Frontend quick start

```bash
cd frontend
npm ci                    # install locked dependencies
npm run dev               # http://localhost:5173 (Vite dev server)
npm run format:check      # Prettier (use `npm run format` to fix)
npm run lint              # ESLint (type-checked rules, a11y, hooks)
npm run typecheck         # strict TypeScript (tsc -b)
npm test                  # Vitest, single run (`npm run test:watch` to watch)
npm run test:coverage     # Vitest with v8 coverage
npm run build             # typecheck + production build into dist/
npm run preview           # serve the production build locally
```

- **Backend integration:** the dev server proxies `/api` and `/health` to
  `http://localhost:8000` (override with `VITE_DEV_PROXY_TARGET`). The dev server binds to
  `localhost:5173` only; that origin must match `SOC_CORS_ALLOWED_ORIGINS` in the backend.
  Start the backend first to see the live "System status" card; without it the card shows an
  error state and everything else keeps working.
- **Configuration:** `VITE_API_BASE_URL` (default `/api/v1`) is the only variable; see
  `frontend/.env.example`. `VITE_*` values are embedded in the public bundle: never put
  secrets in them.
- **Sample-data states (dev/test only):** append `?sample=slow|empty|error|flaky` to the
  dashboard URL to see loading, empty, error and retry states. Production builds ignore it.
- **Production build:** `npm run build` emits static files to `frontend/dist/` (git-ignored).
  There is no production hosting or Docker image yet (Day 4).

See [frontend.md](frontend.md) for the frontend architecture and its current limitations.

## Git workflow

- `main` is always releasable and will be protected (PR + passing CI required) once CI
  exists.
- One branch per milestone, named `<type>/<short-description>`:
  `feat/…`, `fix/…`, `docs/…`, `chore/…`, `test/…`, `refactor/…`.
- Open a PR into `main` using the PR template. **PRs are merged only with the project
  owner's approval.**
- Prefer small, focused commits; squash-merge is not required, so the commit history
  should stay meaningful.

### Commit messages: Conventional Commits

```
<type>(<optional scope>): <imperative summary, ≤ 72 chars>

<optional body: what and why>
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `chore`, `ci`, `build`, `style`.

Examples:

```
feat(detection): add password spraying rule mapped to T1110.003
fix(auth): revoke token family on refresh token reuse
docs: add architecture and security design
```

## Coding standards

**Backend:** `ruff` (lint + format), `mypy` (strict on `app/`), type hints everywhere,
Pydantic v2 models at boundaries, no business logic in routers, repositories are the only
layer that touches MongoDB.

**Frontend:** TypeScript `strict`, ESLint + Prettier, feature-folder structure, Tailwind
theme tokens instead of raw colors (the default Tailwind palette is disabled), Zod validation
of API responses, no `dangerouslySetInnerHTML`, and simulated data imported only by the
dashboard composition root (enforced by ESLint and a test).

## Testing

| Layer | Tooling | Scope |
|---|---|---|
| Backend unit | pytest | services, parsers, rules, ML features (no DB) |
| Backend integration | pytest + httpx + MongoDB service | routers + repositories |
| Security | pytest | authn/authz matrix, injection, response safety (see [security.md](security.md#10-security-testing)) |
| Scenario (E2E) | pytest + simulator | scenario → expected alerts/incidents |
| Frontend | Vitest + Testing Library + MSW (jsdom) | components, hooks, API client, routing, design-token contrast, architecture rules |

A milestone is "done" only when its tests pass locally and in CI.

## Secrets

Never commit `.env` files, credentials, tokens, private keys or real IPs/usernames.
Use `.env.example` with placeholders. CI runs gitleaks.

## Documentation

Docs live in `docs/`. Significant decisions get an ADR in `docs/adr/` using the template
in [adr/README.md](adr/README.md).
