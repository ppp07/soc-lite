# 0004. Short-lived JWT + rotating opaque refresh tokens

- Status: Accepted
- Date: 2026-11-26

## Context

JWT authentication is a project requirement. Long-lived JWTs cannot be revoked and
are dangerous if stolen; storing tokens in `localStorage` exposes them to XSS, a real
concern for a UI that renders attacker-controlled log content.

## Decision

- **Access token:** JWT, 15-minute lifetime, held in memory by the SPA, sent as
  `Authorization: Bearer`. Validated for signature, `exp`, `iss`, `aud`.
- **Refresh token:** opaque 256-bit random value, stored server-side as a SHA-256 hash,
  delivered in an `httpOnly; Secure; SameSite=Strict` cookie scoped to `/api/v1/auth`.
- **Rotation:** every refresh issues a new refresh token; presenting an already-rotated
  token revokes its whole family (theft detection) and is audited.
- **WebSockets:** authenticated using short-lived, single-use tickets rather than JWTs in
  the URL.

## Consequences

- Stolen access tokens expire quickly; refresh tokens are revocable and unreachable
  from JavaScript.
- Requires a `refresh_tokens` collection and silent-refresh logic in the frontend.
- Page reload requires a refresh call to obtain a new access token. This is acceptable.

## Alternatives considered

- **Long-lived JWT only:** no revocation.
- **Tokens in localStorage:** exposed to XSS.
- **Server-side sessions only:** viable, but JWT was an explicit requirement.
