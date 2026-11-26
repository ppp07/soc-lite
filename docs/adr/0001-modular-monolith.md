# 0001. Modular monolith with FastAPI

- Status: Accepted
- Date: 2026-11-26

## Context

SOC-Lite has ~12 functional modules (ingestion, parsing, detection, ML, alerts, incidents,
response, …). It is developed by a small team over 30 days and must run on a laptop.
Microservices would add network boundaries, deployment and observability overhead
without benefit at this scale.

## Decision

Build a single FastAPI service organized as a **modular monolith**: each module lives in
`backend/app/modules/<name>/` with its own router, service, repository and schemas.
Modules interact only through service interfaces or the event bus, never through each
other's repositories or collections.

## Consequences

- One process to run, debug and test; simple Docker Compose setup.
- Clear boundaries make it possible to extract a module (e.g., ingestion) into its own
  service later.
- Boundaries are enforced by convention and code review. An import-linting check may be
  added if violations appear.
- Throughput is bounded by one process, which is acceptable for simulated workloads.

## Alternatives considered

- **Microservices:** rejected as premature; high operational cost.
- **Unstructured monolith:** rejected; harder to test and reason about.
