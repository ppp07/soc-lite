# 0003. Automated response is simulated only

- Status: Accepted
- Date: 2026-11-26

## Context

Automated incident response is a core feature. Real response (firewall changes,
account disablement, command execution) can cause outages, lock out legitimate users,
or be abused if SOC-Lite itself is compromised. This project is a learning and
demonstration platform running on simulated data.

## Decision

All response actions are **simulated**. The action catalog contains only:
`block_ip`, `disable_user`, `notify`, `escalate`, `open_incident`. Each writes records
to SOC-Lite's own collections (`response_actions`, `blocklist`, simulated identity
flags). There is no action type that executes commands or calls external systems.

Enforcement:

1. Allow-listed action catalog (enum); unknown types are rejected at validation.
2. `simulated: true` is set server-side on every action record.
3. Automated tests verify the response package imports no `subprocess`, `os.system`,
   `socket`, or HTTP client modules, and every action type is in the catalog.
4. The UI labels all response output as *Simulated*.

## Consequences

- Safe to demo and to run against any data.
- Playbooks, approval flows, dry-run and revert can still be demonstrated in full.
- Integrating real enforcement would require a new ADR and is out of scope.

## Alternatives considered

- **Real integrations behind a feature flag:** rejected; risk outweighs value for
  this project.
