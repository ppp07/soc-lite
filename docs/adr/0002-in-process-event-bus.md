# 0002. In-process async event bus behind an interface

- Status: Accepted
- Date: 2026-11-26

## Context

The pipeline (ingest → parse → detect/ML → alert → respond → realtime) is naturally
event-driven. Options include Kafka, Redis Streams, MongoDB change streams (require a
replica set), or an in-process queue.

## Decision

Use an in-process publish/subscribe bus built on bounded `asyncio.Queue`s, exposed via
an `EventBus` protocol (`publish(topic, message)`, `subscribe(topic, handler)`).
Handlers run as background tasks managed by the FastAPI lifespan.

## Consequences

- No extra infrastructure; trivially testable with a synchronous in-memory fake.
- Bounded queues give backpressure; ingestion returns `429/503` when saturated.
- Events in flight are lost on crash. This is acceptable because raw logs are persisted first
  and can be reprocessed (`parse_status = pending`).
- Single-process only. Swapping to Redis Streams later requires only a new `EventBus`
  implementation.

## Alternatives considered

- **Kafka:** too heavy for the project scope.
- **Redis Streams:** good future option; adds a service now for little benefit.
- **Mongo change streams:** require replica set; couple pipeline to DB.
