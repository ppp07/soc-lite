# Security Architecture

> Status: **Approved design (Day 1)**.

SOC-Lite is a security tool, so it holds itself to the controls it would expect of the
systems it monitors.

## 1. Safety boundary: simulated response only

All automated and manual response actions are **simulated**. SOC-Lite will never:

- execute shell commands or call OS/network APIs as a response action,
- modify real firewalls, routers, cloud security groups or DNS,
- disable, lock or modify real user accounts in any external directory.

Response actions only write records to SOC-Lite's own collections (`response_actions`,
`blocklist`, and a `simulated_disabled` flag on simulated identities). This is enforced by:

- an allow-listed action catalog with no "run command" or external-integration types,
- `simulated: true` set server-side on every action record (not client-controllable),
- unit tests asserting that the response package imports no subprocess/socket/HTTP-client
  modules, and that every action type is in the simulated catalog.

See [ADR-0003](adr/0003-simulated-response-only.md).

## 2. Authentication

| Control | Design |
|---|---|
| Password hashing | Argon2id via `pwdlib` |
| Password policy | min 12 chars; reject top common passwords (small bundled list) |
| Access token | JWT, 15 min, claims `sub`, `role`, `exp`, `iat`, `jti`, `iss`, `aud`; HS256 (dev) with RS256 option |
| Refresh token | 256-bit opaque random value, stored as SHA-256 hash, `httpOnly; Secure; SameSite=Strict` cookie scoped to `/api/v1/auth` |
| Rotation | new refresh token on every refresh; reuse of a rotated token revokes the entire family |
| Login throttling | per-IP and per-username rate limits (`slowapi`) + account lockout with backoff |
| Generic errors | login failures return the same message whether the user exists or not |
| Self-monitoring | SOC-Lite's own login events are fed into its pipeline as events |

See [ADR-0004](adr/0004-jwt-with-rotating-refresh-tokens.md).

## 3. Authorization

- Role-based access control: `viewer` < `analyst` < `admin`.
- Enforced via FastAPI dependencies on **every** route; routers default to requiring
  authentication, and public routes are explicitly opted out.
- Object-level checks in services (e.g., only admins can modify other users).
- An automated test enumerates all registered routes and fails if any non-allow-listed
  route is reachable without authentication.

## 4. Input validation and injection defences

| Threat | Defence |
|---|---|
| NoSQL injection | Typed Pydantic inputs; repositories build queries from typed values only; reject keys starting with `$` or containing `.` in any user-supplied dict; never use `$where` |
| Oversized payloads | Request body limits; per-line length cap on ingest; batch size cap |
| Mass assignment | Separate create/update schemas; `extra="forbid"` |
| Sort/filter abuse | Allow-listed sort and filter fields |
| Regex DoS | Free-text search escapes regex metacharacters and caps length |
| XSS (log content is attacker-controlled) | React escaping; no `dangerouslySetInnerHTML`; strict CSP |
| Log injection | Structured JSON logging; control characters escaped in log output |

## 5. Transport and HTTP hardening

- CORS restricted to the configured frontend origin, credentials allowed only for it.
- Security headers: `Content-Security-Policy`, `Strict-Transport-Security` (when TLS),
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`,
  `frame-ancestors 'none'`.
- WebSocket authentication via short-lived single-use tickets (no JWT in URLs).
- TLS is terminated by a reverse proxy in any non-local deployment.

## 6. Secrets management

- All secrets come from environment variables loaded by `pydantic-settings`.
- `.env` and `.env.*` (except `.env.example`) are git-ignored; `.env.example` contains
  placeholders only.
- `scripts/generate-dev-secrets` (planned) creates random local secrets.
- The app refuses to start in non-development mode with default/placeholder secrets.
- CI runs **gitleaks** on every push and PR.
- Seeded demo users get random passwords printed once at seed time; no hard-coded
  credentials in the repository.
- Simulated datasets use reserved documentation IP ranges (RFC 5737 / RFC 3849) and
  fictitious usernames/domains (`example.com`).

## 7. Audit logging

Every security-relevant action writes an append-only record to `audit_logs`
(schema in [database-schema.md](database-schema.md#audit_logs-append-only)).
Audit writes happen in the service layer so they cannot be bypassed by a new route.

### Audit catalog

| Domain | Actions |
|---|---|
| Auth | `auth.login.success`, `auth.login.failure`, `auth.lockout`, `auth.logout`, `auth.refresh`, `auth.refresh.reuse_detected` |
| Authorization | `authz.denied` |
| Users | `user.create`, `user.update`, `user.role_change`, `user.deactivate`, `user.delete`, `user.password_change` |
| API keys | `apikey.create`, `apikey.revoke`, `apikey.auth.failure` |
| Rules | `rule.enable`, `rule.disable`, `rule.params_update` |
| Alerts | `alert.status_change`, `alert.assign`, `alert.comment`, `alert.bulk_update` |
| Incidents | `incident.create`, `incident.update`, `incident.status_change`, `incident.alert_link` |
| Response | `playbook.create`, `playbook.update`, `playbook.delete`, `response.execute`, `response.approve`, `response.reject`, `response.revert`, `blocklist.remove` |
| ML | `ml.train`, `ml.activate`, `ml.integrity_failure` |
| Simulator | `simulator.run`, `simulator.stop` |
| System | `system.startup`, `system.config_warning` |

Rules for audit records:

- Never contain passwords, tokens, API keys or hashes.
- Include actor, role, outcome, target, IP, user agent and request ID.
- No API exists to modify or delete audit records.
- Tests assert that each action in the catalog is emitted by its corresponding operation.

## 8. ML model integrity

`joblib` artifacts are pickle-based and can execute code when loaded. Therefore:

- only models trained by SOC-Lite itself are loaded;
- artifacts live in a fixed directory outside any user-writable upload path;
- the SHA-256 recorded in `ml_models` is verified before every load;
- there is no model upload endpoint.

## 9. Supply chain and CI security

- Lockfiles: `uv.lock`, `package-lock.json`.
- Dependabot for Python, npm and GitHub Actions.
- CI: `ruff`, `mypy`, `pytest`, `pip-audit`, `eslint`, `tsc`, `vitest`, `npm audit`
  (high+), `gitleaks`.
- GitHub Actions use pinned versions and least-privilege `permissions:`.
- Branch protection on `main` (required PR + passing CI) once CI is green.

## 10. Security testing

| Type | Examples |
|---|---|
| AuthN tests | expired/forged/wrong-audience tokens rejected; refresh reuse revokes family; lockout triggers |
| AuthZ tests | role matrix per endpoint; unauthenticated route scan |
| Injection tests | `$ne`/`$gt`/`$where` payloads rejected; regex DoS inputs bounded |
| Input tests | oversized bodies/lines rejected; unknown fields rejected |
| Response safety tests | no forbidden imports in response package; `simulated` always true |
| Secrets | gitleaks in CI; startup refuses placeholder secrets in production mode |
| Headers | security headers present on responses |

## 11. Threat model summary (STRIDE)

| Threat | Example | Mitigation |
|---|---|---|
| Spoofing | stolen access token | short TTL, refresh rotation, reuse detection |
| Tampering | forged ingest data | API keys with scopes; validation; raw log retention |
| Repudiation | analyst denies closing an alert | append-only audit log with request IDs |
| Information disclosure | stack traces, secrets in logs | problem+json errors, log redaction, gitleaks |
| Denial of service | log flood, login flood | bounded queues, size limits, rate limits |
| Elevation of privilege | viewer calls admin route | dependency-enforced RBAC + route scan test |
