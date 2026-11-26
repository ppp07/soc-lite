# 0005. MongoDB with PyMongo's async API

- Status: Accepted
- Date: 2026-11-26

## Context

MongoDB is a project requirement. Security events are semi-structured (fields vary by
source), which suits a document store. For async Python, Motor was historically used,
but MongoDB has deprecated Motor in favour of the native async API in PyMongo.

## Decision

- Use MongoDB (run via Docker Compose with authentication enabled and a least-privilege
  application user).
- Use PyMongo's async client (`AsyncMongoClient`).
- Access the database only through module repositories.
- Use TTL indexes on high-volume collections (`raw_logs`, optionally `events`) and the
  simulated `blocklist`.

## Consequences

- Flexible schema for heterogeneous logs; aggregation pipelines power the dashboard.
- Schema consistency is enforced in the application (Pydantic) rather than the DB.
- Integration tests run against a real MongoDB service container (in CI and locally via
  Compose) rather than a mock, so query behaviour is tested faithfully.

## Alternatives considered

- **Motor:** deprecated.
- **ODMs (Beanie, ODMantic):** add abstraction; repositories with Pydantic are enough.
