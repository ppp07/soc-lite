import type { AlertListItem } from '../api/schemas/alerts'
import type {
  AlertsSeries,
  DashboardSummary,
  EventsSeries,
  TopList,
} from '../api/schemas/dashboard'
import type { IncidentListItem } from '../api/schemas/incidents'
import { createRng, type Rng } from './rng'

/**
 * Simulated SOC activity for one fixed 24-hour window.
 *
 * Everything here is fictitious (docs/simulation.md): IPs come from the documentation ranges
 * 192.0.2.0/24, 198.51.100.0/24 and 203.0.113.0/24 (plus a private 10.x address for an internal
 * host), people are made up and live at example.com, and the window is anchored to a fixed date
 * so nothing ever looks "live". One alert list is the single source of truth: the KPIs, the
 * severity breakdown, the time series and the top-N lists are all derived from it, so the
 * numbers on the dashboard agree with each other.
 */

export const SAMPLE_SEED = 20261128
export const SAMPLE_WINDOW = { from: '2026-11-27T09:00:00Z', to: '2026-11-28T09:00:00Z' } as const

const HOUR_MS = 3_600_000
const MINUTE_MS = 60_000
const START_MS = Date.parse(SAMPLE_WINDOW.from)

/** Previous-window values are the current ones scaled by a fixed ratio (sample deltas only). */
const PREVIOUS_RATIO = { events: 0.93, openAlerts: 0.8, critical: 1.5, incidents: 0.67, mttr: 1.18 }

type Severity = AlertListItem['severity']
type Status = AlertListItem['status']
type Mitre = AlertListItem['mitre'][number]

const MITRE = {
  guess: {
    tactic_id: 'TA0006',
    tactic: 'Credential Access',
    technique_id: 'T1110',
    technique: 'Brute Force',
    subtechnique_id: 'T1110.001',
  },
  spray: {
    tactic_id: 'TA0006',
    tactic: 'Credential Access',
    technique_id: 'T1110',
    technique: 'Brute Force',
    subtechnique_id: 'T1110.003',
  },
  bruteForce: {
    tactic_id: 'TA0006',
    tactic: 'Credential Access',
    technique_id: 'T1110',
    technique: 'Brute Force',
  },
  validAccounts: {
    tactic_id: 'TA0001',
    tactic: 'Initial Access',
    technique_id: 'T1078',
    technique: 'Valid Accounts',
  },
  discovery: {
    tactic_id: 'TA0007',
    tactic: 'Discovery',
    technique_id: 'T1046',
    technique: 'Network Service Discovery',
  },
  exploit: {
    tactic_id: 'TA0001',
    tactic: 'Initial Access',
    technique_id: 'T1190',
    technique: 'Exploit Public-Facing Application',
  },
  exfil: {
    tactic_id: 'TA0010',
    tactic: 'Exfiltration',
    technique_id: 'T1048',
    technique: 'Exfiltration Over Alternative Protocol',
  },
} as const satisfies Record<string, Mitre>

interface AlertSpec {
  rule: string
  title: string
  severity: Severity
  status: Status
  mitre: readonly Mitre[]
  /** Minutes after the window start. */
  atMin: number
  spanMin: number
  count: number
  ips?: readonly string[]
  users?: readonly string[]
  hosts?: readonly string[]
  incident?: string
}

/** The story of the day: each entry follows a scenario from docs/simulation.md. */
const STORY: readonly AlertSpec[] = [
  {
    rule: 'brute_force.spraying',
    title: 'Password spraying across staff accounts',
    severity: 'high',
    status: 'resolved',
    mitre: [MITRE.spray],
    atMin: 750,
    spanMin: 38,
    count: 126,
    ips: ['198.51.100.77'],
    users: [
      'a.nguyen@example.com',
      'b.haddad@example.com',
      'c.mueller@example.com',
      'd.kowalski@example.com',
      'e.santos@example.com',
      'f.ibrahim@example.com',
    ],
    incident: 'INC-0005',
  },
  {
    rule: 'web.exploit_attempt',
    title: 'Path traversal probes against web-01',
    severity: 'high',
    status: 'acknowledged',
    mitre: [MITRE.exploit],
    atMin: 836,
    spanMin: 17,
    count: 14,
    ips: ['198.51.100.23'],
    hosts: ['web-01.example.com'],
    incident: 'INC-0006',
  },
  {
    rule: 'web.exploit_attempt',
    title: 'SQL injection probes against web-01',
    severity: 'high',
    status: 'acknowledged',
    mitre: [MITRE.exploit],
    atMin: 851,
    spanMin: 11,
    count: 9,
    ips: ['198.51.100.23'],
    hosts: ['web-01.example.com'],
    incident: 'INC-0006',
  },
  {
    rule: 'login.impossible_travel',
    title: 'Impossible travel for j.alvarez@example.com',
    severity: 'high',
    status: 'in_progress',
    mitre: [MITRE.validAccounts],
    atMin: 980,
    spanMin: 4,
    count: 1,
    ips: ['192.0.2.140', '203.0.113.9'],
    users: ['j.alvarez@example.com'],
  },
  {
    rule: 'brute_force.classic',
    title: 'SSH password guessing against root and admin',
    severity: 'high',
    status: 'acknowledged',
    mitre: [MITRE.guess],
    atMin: 1090,
    spanMin: 52,
    count: 342,
    ips: ['203.0.113.45'],
    users: ['root', 'admin'],
    hosts: ['bastion-01.example.com'],
    incident: 'INC-0007',
  },
  {
    rule: 'login.success_after_failures',
    title: 'Successful login after repeated failures for m.okafor@example.com',
    severity: 'critical',
    status: 'new',
    mitre: [MITRE.bruteForce, MITRE.validAccounts],
    atMin: 1122,
    spanMin: 1,
    count: 1,
    ips: ['203.0.113.45'],
    users: ['m.okafor@example.com'],
    hosts: ['bastion-01.example.com'],
    incident: 'INC-0007',
  },
  {
    rule: 'login.new_country',
    title: 'First login from a new country for m.okafor@example.com',
    severity: 'medium',
    status: 'new',
    mitre: [MITRE.validAccounts],
    atMin: 1124,
    spanMin: 1,
    count: 1,
    ips: ['203.0.113.45'],
    users: ['m.okafor@example.com'],
    incident: 'INC-0007',
  },
  {
    rule: 'network.port_scan',
    title: 'Port scan against the DMZ',
    severity: 'medium',
    status: 'acknowledged',
    mitre: [MITRE.discovery],
    atMin: 1255,
    spanMin: 9,
    count: 913,
    ips: ['192.0.2.88'],
    hosts: ['dmz-gw.example.com'],
  },
  {
    rule: 'login.disabled_or_privileged',
    title: 'Login attempt to disabled account d.kowalski@example.com',
    severity: 'medium',
    status: 'new',
    mitre: [MITRE.validAccounts],
    atMin: 1300,
    spanMin: 6,
    count: 2,
    ips: ['198.51.100.61'],
    users: ['d.kowalski@example.com'],
  },
  {
    rule: 'exfil.volume_spike',
    title: 'Outbound transfer far above baseline from files-02',
    severity: 'critical',
    status: 'new',
    mitre: [MITRE.exfil],
    atMin: 1345,
    spanMin: 24,
    count: 3,
    ips: ['10.20.4.17'],
    hosts: ['files-02.example.com'],
    incident: 'INC-0008',
  },
  {
    rule: 'ml.anomaly',
    title: 'Anomalous traffic profile on files-02',
    severity: 'medium',
    status: 'new',
    mitre: [MITRE.exfil],
    atMin: 1352,
    spanMin: 18,
    count: 1,
    ips: ['10.20.4.17'],
    hosts: ['files-02.example.com'],
    incident: 'INC-0008',
  },
  {
    rule: 'login.off_hours',
    title: 'Off-hours admin login for p.raman@example.com',
    severity: 'low',
    status: 'resolved',
    mitre: [MITRE.validAccounts],
    atMin: 40,
    spanMin: 1,
    count: 1,
    ips: ['192.0.2.14'],
    users: ['p.raman@example.com'],
    incident: 'INC-0004',
  },
  {
    rule: 'login.off_hours',
    title: 'Off-hours admin login for t.ferreira@example.com',
    severity: 'low',
    status: 'resolved',
    mitre: [MITRE.validAccounts],
    atMin: 95,
    spanMin: 1,
    count: 1,
    ips: ['192.0.2.19'],
    users: ['t.ferreira@example.com'],
    incident: 'INC-0004',
  },
]

const INCIDENTS: readonly Omit<IncidentListItem, 'id' | 'alert_count'>[] = [
  {
    number: 'INC-0008',
    title: 'Unusual outbound transfer from files-02',
    severity: 'critical',
    status: 'investigating',
    owner: 'Tomás Ferreira',
    opened_at: '2026-11-28T07:26:00Z',
    updated_at: '2026-11-28T08:41:00Z',
  },
  {
    number: 'INC-0007',
    title: 'Credential compromise on bastion-01',
    severity: 'critical',
    status: 'open',
    owner: null,
    opened_at: '2026-11-28T03:44:00Z',
    updated_at: '2026-11-28T08:15:00Z',
  },
  {
    number: 'INC-0006',
    title: 'Web exploit probes against web-01',
    severity: 'high',
    status: 'contained',
    owner: 'Priya Raman',
    opened_at: '2026-11-27T23:08:00Z',
    updated_at: '2026-11-28T06:10:00Z',
  },
  {
    number: 'INC-0005',
    title: 'Password spraying against staff accounts',
    severity: 'high',
    status: 'resolved',
    owner: 'Priya Raman',
    opened_at: '2026-11-27T21:34:00Z',
    updated_at: '2026-11-27T23:50:00Z',
  },
  {
    number: 'INC-0004',
    title: 'Repeated off-hours admin logins',
    severity: 'medium',
    status: 'closed',
    owner: 'Tomás Ferreira',
    opened_at: '2026-11-27T09:40:00Z',
    updated_at: '2026-11-27T11:55:00Z',
  },
]

const NOISE_RULES = [
  {
    rule: 'login.off_hours',
    title: (u: string) => `Off-hours login for ${u}`,
    severity: 'low' as const,
  },
  {
    rule: 'login.new_country',
    title: (u: string) => `First login from a new country for ${u}`,
    severity: 'low' as const,
  },
  {
    rule: 'network.port_scan',
    title: () => 'Low-volume port probe on the perimeter',
    severity: 'low' as const,
  },
]
const NOISE_USERS = [
  'a.nguyen',
  'b.haddad',
  'c.mueller',
  'e.santos',
  'f.ibrahim',
  'k.watanabe',
  'l.oduya',
].map((u) => `${u}@example.com`)
const NOISE_IPS = [
  '192.0.2.31',
  '192.0.2.57',
  '198.51.100.5',
  '198.51.100.119',
  '203.0.113.71',
  '203.0.113.200',
]
const NOISE_STATUS: readonly Status[] = [
  'resolved',
  'resolved',
  'false_positive',
  'acknowledged',
  'new',
]
const NOISE_MITRE: Record<string, Mitre> = {
  'login.off_hours': MITRE.validAccounts,
  'login.new_country': MITRE.validAccounts,
  'network.port_scan': MITRE.discovery,
}

function noiseAlerts(rng: Rng): AlertSpec[] {
  return Array.from({ length: 10 }, () => {
    const kind = rng.pick(NOISE_RULES)
    const user = rng.pick(NOISE_USERS)
    const at = rng.int(30, 24 * 60 - 30)
    return {
      rule: kind.rule,
      title: kind.title(user),
      severity: kind.severity,
      status: rng.pick(NOISE_STATUS),
      mitre: [NOISE_MITRE[kind.rule] ?? MITRE.validAccounts],
      atMin: at,
      spanMin: rng.int(1, 12),
      count: kind.rule === 'network.port_scan' ? rng.int(40, 180) : 1,
      ips: [rng.pick(NOISE_IPS)],
      ...(kind.rule === 'network.port_scan' ? {} : { users: [user] }),
    }
  })
}

const iso = (ms: number): string => new Date(ms).toISOString().replace('.000Z', 'Z')
const OPEN_ALERT: readonly Status[] = ['new', 'acknowledged', 'in_progress']

export interface SampleDataset {
  summary: DashboardSummary
  events: EventsSeries
  alertsSeries: AlertsSeries
  alerts: AlertListItem[]
  incidents: IncidentListItem[]
  top(field: 'source_ip' | 'user', limit: number): TopList
}

export function buildSampleDataset(seed: number = SAMPLE_SEED): SampleDataset {
  const rng = createRng(seed)
  const specs = [...STORY, ...noiseAlerts(rng)]

  const alerts: AlertListItem[] = specs.map((s) => ({
    id: rng.hex(24),
    rule_key: s.rule,
    title: s.title,
    severity: s.severity,
    status: s.status,
    first_seen: iso(START_MS + s.atMin * MINUTE_MS),
    last_seen: iso(START_MS + (s.atMin + s.spanMin) * MINUTE_MS),
    count: s.count,
    entities: { ips: [...(s.ips ?? [])], users: [...(s.users ?? [])], hosts: [...(s.hosts ?? [])] },
    mitre: [...s.mitre],
  }))
  // Newest activity first, as an analyst's list would be.
  const order = alerts
    .map((a, i) => ({ a, incident: specs[i]?.incident }))
    .sort((x, y) => y.a.last_seen.localeCompare(x.a.last_seen))
  const sortedAlerts = order.map((o) => o.a)

  const incidentAlertCount = new Map<string, number>()
  for (const o of order) {
    if (o.incident)
      incidentAlertCount.set(o.incident, (incidentAlertCount.get(o.incident) ?? 0) + 1)
  }
  const incidents: IncidentListItem[] = INCIDENTS.map((i) => ({
    ...i,
    id: rng.hex(24),
    alert_count: incidentAlertCount.get(i.number) ?? 0,
  }))

  // Events per hour: a daytime-peaking baseline plus a burst where each alert fired.
  const events = Array.from({ length: 24 }, (_, h) => {
    const hourOfDay = (9 + h) % 24
    const diurnal = 0.55 + 0.45 * Math.cos(((hourOfDay - 14) / 24) * 2 * Math.PI)
    return Math.round(4200 * diurnal * (0.94 + rng.next() * 0.12))
  })
  const bucket = (iso: string) => Math.floor((Date.parse(iso) - START_MS) / HOUR_MS)
  for (const a of alerts) {
    const h = bucket(a.first_seen)
    if (h >= 0 && h < 24) events[h] = (events[h] ?? 0) + a.count * 4
  }

  const alertRows = Array.from({ length: 24 }, (_, h) => {
    const row = { ts: iso(START_MS + h * HOUR_MS), critical: 0, high: 0, medium: 0, low: 0 }
    for (const a of alerts) if (bucket(a.first_seen) === h) row[a.severity] += 1
    return row
  })

  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 }
  for (const a of alerts) bySeverity[a.severity] += 1

  const totalEvents = events.reduce((sum, v) => sum + v, 0)
  const eventsPerMinute = Math.round(totalEvents / (24 * 60))
  const openAlerts = alerts.filter((a) => OPEN_ALERT.includes(a.status)).length
  const criticalOpen = alerts.filter(
    (a) => a.severity === 'critical' && OPEN_ALERT.includes(a.status),
  ).length
  const openIncidents = incidents.filter(
    (i) => i.status !== 'resolved' && i.status !== 'closed',
  ).length
  const finished = incidents.filter((i) => i.status === 'resolved' || i.status === 'closed')
  const mttr = Math.round(
    finished.reduce((s, i) => s + (Date.parse(i.updated_at) - Date.parse(i.opened_at)), 0) /
      Math.max(finished.length, 1) /
      MINUTE_MS,
  )

  const kpi = (value: number, ratio: number) => ({ value, previous: Math.round(value * ratio) })

  return {
    summary: {
      window: { ...SAMPLE_WINDOW },
      events_per_minute: kpi(eventsPerMinute, PREVIOUS_RATIO.events),
      open_alerts: kpi(openAlerts, PREVIOUS_RATIO.openAlerts),
      critical_alerts: kpi(criticalOpen, PREVIOUS_RATIO.critical),
      open_incidents: kpi(openIncidents, PREVIOUS_RATIO.incidents),
      mttr_minutes: kpi(mttr, PREVIOUS_RATIO.mttr),
      alerts_by_severity: bySeverity,
    },
    events: {
      metric: 'events',
      interval: 'hour',
      points: events.map((value, h) => ({ ts: iso(START_MS + h * HOUR_MS), value })),
    },
    alertsSeries: { metric: 'alerts', interval: 'hour', points: alertRows },
    alerts: sortedAlerts,
    incidents,
    top(field, limit) {
      const tally = new Map<string, number>()
      for (const a of alerts) {
        if (field === 'source_ip') {
          for (const ip of a.entities.ips) tally.set(ip, (tally.get(ip) ?? 0) + a.count)
        } else {
          for (const u of a.entities.users) tally.set(u, (tally.get(u) ?? 0) + 1)
        }
      }
      const items = [...tally.entries()]
        .map(([key, count]) => ({ key, count }))
        .sort((x, y) => y.count - x.count || x.key.localeCompare(y.key))
        .slice(0, limit)
      return { field, items }
    },
  }
}
