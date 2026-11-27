# Developer Guide

> Status: **Day 2**. Backend setup commands are available; frontend and Docker arrive on Days 3–4.

## Prerequisites

| Tool | Purpose |
|---|---|
| Git, GitHub CLI (`gh`) | version control, PRs |
| Docker + Docker Compose | MongoDB and full-stack runs |
| Python 3.12+ and [uv](https://docs.astral.sh/uv/) | backend |
| Node.js LTS + npm | frontend |

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
theme tokens instead of raw colors, Zod validation of API responses.

## Testing

| Layer | Tooling | Scope |
|---|---|---|
| Backend unit | pytest | services, parsers, rules, ML features (no DB) |
| Backend integration | pytest + httpx + MongoDB service | routers + repositories |
| Security | pytest | authn/authz matrix, injection, response safety (see [security.md](security.md#10-security-testing)) |
| Scenario (E2E) | pytest + simulator | scenario → expected alerts/incidents |
| Frontend | Vitest + Testing Library + MSW | components, hooks, flows |

A milestone is "done" only when its tests pass locally and in CI.

## Secrets

Never commit `.env` files, credentials, tokens, private keys or real IPs/usernames.
Use `.env.example` with placeholders. CI runs gitleaks.

## Documentation

Docs live in `docs/`. Significant decisions get an ADR in `docs/adr/` using the template
in [adr/README.md](adr/README.md).
