# Simulated Data and Attack Scenarios

> Status: **Approved design (Day 1)**. Implementation planned for Days 9–10.

SOC-Lite is developed and demonstrated **only** with simulated data. Nothing in this
project collects logs from, or acts on, real third-party systems.

## Principles

- **Reproducible:** every generator takes a `seed`; the same seed + scenario produces the
  same events (timestamps are relative to a configurable start time).
- **Realistic:** log formats match real-world formats (OpenSSH `auth.log`, Nginx combined
  access log, a simple firewall format, JSON application logs), so the parsers are
  exercised on realistic input.
- **Safe identifiers:** IPs come from documentation ranges (`192.0.2.0/24`,
  `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32`) plus private ranges for "internal"
  hosts; users and domains are fictitious (`*.example.com`).
- **Labelled:** generated events carry a `scenario_id` tag, so tests and ML evaluation can
  measure detection accuracy.
- **Geo enrichment:** a static lookup table maps simulated IP ranges to fictitious
  locations with real-world coordinates, enabling impossible-travel detection.

## Baseline traffic

A population of simulated users (configurable, default 50) with:

- working-hours profiles per timezone,
- typical source IPs/countries per user,
- occasional mistyped passwords (normal failure rate),
- normal web browsing and API traffic,
- background firewall allow/deny noise.

## Attack scenarios

| Scenario ID | Description | Expected detections |
|---|---|---|
| `ssh_brute_force` | one external IP, hundreds of SSH failures against `root`/`admin` | `brute_force.classic` (T1110.001) |
| `password_spray` | one IP, one or two common passwords across many users | `brute_force.spraying` (T1110.003) |
| `distributed_brute_force` | botnet-like set of IPs targeting one account | `brute_force.distributed` (T1110) |
| `credential_compromise` | brute force followed by a successful login and unusual activity | `brute_force.classic`, `login.success_after_failures` (T1078) |
| `impossible_travel` | same user logs in from two distant countries minutes apart | `login.impossible_travel` (T1078) |
| `off_hours_admin` | privileged account login at 03:00 from a new country | `login.off_hours`, `login.new_country` |
| `port_scan` | sequential and random port probes from one source | `network.port_scan` (T1046) |
| `web_attack` | path traversal and SQLi probe requests | `web.exploit_attempt` (T1190) |
| `data_exfiltration` | large outbound transfer from an internal host | `exfil.volume_spike` (T1048), `ml.anomaly` |
| `full_kill_chain` | port scan → web exploit → brute force → login → exfil | multiple alerts grouped into one incident |

## Datasets

Planned under `backend/app/simulator/datasets/`:

- `geo_table.json`: simulated IP range → location mapping.
- `users.json`: simulated user population (no real people).
- `samples/`: small static log files for parser unit tests and the file-tailer demo.
- Generated larger datasets are written to a git-ignored directory on demand.

## Running scenarios (planned)

- API: `POST /api/v1/simulator/run {"scenario": "full_kill_chain", "seed": 42, "speed": 10}`
- CLI: `uv run python -m app.simulator run full_kill_chain --seed 42`
- Dashboard: an admin-only "Run scenario" panel (development mode only).

Each scenario has an automated end-to-end test asserting that its expected detections
fire.
