# 0007. MITRE ATT&CK mapping as rule metadata

- Status: Accepted
- Date: 2026-11-26

## Context

Analysts triage faster when alerts carry adversary-behaviour context. MITRE ATT&CK is
the industry-standard taxonomy for this.

## Decision

- Each detection rule declares its ATT&CK tactic(s) and technique/sub-technique IDs in
  code; the mapping is seeded into `detection_rules.mitre`.
- Alerts snapshot the mapping at creation; incidents aggregate it.
- Ship a small, curated in-repo lookup of only the tactics/techniques we use (IDs and
  names) rather than the full STIX dataset, keeping the repo light and offline-friendly.
  The ATT&CK version is recorded alongside the lookup.
- Tests validate ID formats and that every rule is mapped or explicitly `unmapped`.

## Consequences

- Enables filtering by technique and a tactic × technique dashboard heatmap.
- The curated lookup must be updated manually when rules are added or ATT&CK changes.

## Alternatives considered

- **Full ATT&CK STIX bundle:** large, unnecessary for ~12 rules. It can be added later.
- **No mapping:** loses analyst value; contradicts requirements.
