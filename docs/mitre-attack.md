# MITRE ATT&CK Mapping

> Status: **Approved design (Day 1)**. Mappings are implemented as rule metadata in
> `backend/app/modules/detection/mitre.py` (planned, Days 15–18). The exact ATT&CK
> Enterprise version used will be recorded in that module when it is implemented.

## How mapping works

- Each detection rule declares one or more ATT&CK entries:
  `{tactic_id, tactic, technique_id, technique, subtechnique_id?}`.
- Mappings are copied onto each alert at creation time, so historical alerts keep the
  mapping that was valid when they fired.
- Incidents aggregate the techniques of their alerts.
- The dashboard shows a tactic × technique heatmap, and alerts can be filtered by
  technique ID.
- A unit test validates that every rule has at least one mapping (or is explicitly
  marked `unmapped` with a reason) and that IDs match the expected format
  (`TA####`, `T####`, `T####.###`).

See [ADR-0007](adr/0007-mitre-attack-mapping.md).

## Planned rule mappings

| Rule key | Detection | Tactic | Technique |
|---|---|---|---|
| `brute_force.classic` | ≥ N failed logins from one IP to one account in T seconds | Credential Access (TA0006) | T1110.001 Brute Force: Password Guessing |
| `brute_force.spraying` | one IP failing against many accounts | Credential Access (TA0006) | T1110.003 Brute Force: Password Spraying |
| `brute_force.distributed` | many IPs failing against one account | Credential Access (TA0006) | T1110 Brute Force |
| `login.success_after_failures` | successful login after a burst of failures | Credential Access (TA0006); Initial Access (TA0001) | T1110 Brute Force; T1078 Valid Accounts |
| `login.impossible_travel` | two logins whose distance/time implies impossible speed | Initial Access (TA0001) | T1078 Valid Accounts |
| `login.new_country` | first login from a country for this user | Initial Access (TA0001) | T1078 Valid Accounts |
| `login.off_hours` | login outside the user's baseline hours | Initial Access (TA0001) | T1078 Valid Accounts |
| `login.disabled_or_privileged` | login attempt to disabled account, or privileged account from new source | Initial Access (TA0001); Privilege Escalation (TA0004) | T1078 Valid Accounts |
| `network.port_scan` | one source touching many destination ports in a short window | Discovery (TA0007) | T1046 Network Service Discovery |
| `web.exploit_attempt` | requests matching common exploit patterns (path traversal, SQLi probes) | Initial Access (TA0001) | T1190 Exploit Public-Facing Application |
| `exfil.volume_spike` | outbound bytes far above an entity's baseline | Exfiltration (TA0010) | T1048 Exfiltration Over Alternative Protocol |
| `ml.anomaly` | IsolationForest anomaly score above threshold | depends on dominant features | mapped heuristically (e.g. auth-failure-driven → T1110), else `unmapped` |

Rule thresholds and mappings will be reviewed when each rule is implemented. Any change
is recorded in that rule's PR.
