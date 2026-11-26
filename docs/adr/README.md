# Architecture Decision Records

An ADR records one significant decision, its context and its consequences.
ADRs are immutable once accepted. To change a decision, add a new ADR that supersedes
the old one.

| # | Title | Status |
|---|---|---|
| [0001](0001-modular-monolith.md) | Modular monolith with FastAPI | Accepted |
| [0002](0002-in-process-event-bus.md) | In-process async event bus behind an interface | Accepted |
| [0003](0003-simulated-response-only.md) | Automated response is simulated only | Accepted |
| [0004](0004-jwt-with-rotating-refresh-tokens.md) | Short-lived JWT + rotating opaque refresh tokens | Accepted |
| [0005](0005-mongodb-document-store.md) | MongoDB with PyMongo's async API | Accepted |
| [0006](0006-isolation-forest-anomaly-detection.md) | IsolationForest for anomaly detection | Accepted |
| [0007](0007-mitre-attack-mapping.md) | MITRE ATT&CK mapping as rule metadata | Accepted |

## Template

```markdown
# NNNN. Title

- Status: Proposed | Accepted | Superseded by NNNN
- Date: YYYY-MM-DD

## Context
## Decision
## Consequences
## Alternatives considered
```
