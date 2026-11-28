import { describe, expect, it } from 'vitest'

import type { DashboardDataSource } from '../api/dashboardSource'
import { ApiError } from '../api/errors'
import { alertPageSchema } from '../api/schemas/alerts'
import {
  alertsSeriesSchema,
  eventsSeriesSchema,
  summarySchema,
  topSchema,
} from '../api/schemas/dashboard'
import { incidentPageSchema } from '../api/schemas/incidents'
import { buildSampleDataset, SAMPLE_WINDOW } from './dataset'
import { createRng } from './rng'
import { createSampleDashboardSource, parseSampleScenario } from './source'

const DOC_RANGES = [
  /^192\.0\.2\.\d+$/,
  /^198\.51\.100\.\d+$/,
  /^203\.0\.113\.\d+$/,
  /^10\.20\.4\.\d+$/,
]
// Rule keys and technique ids documented in docs/mitre-attack.md.
const RULES = [
  'brute_force.classic',
  'brute_force.spraying',
  'brute_force.distributed',
  'login.success_after_failures',
  'login.impossible_travel',
  'login.new_country',
  'login.off_hours',
  'login.disabled_or_privileged',
  'network.port_scan',
  'web.exploit_attempt',
  'exfil.volume_spike',
  'ml.anomaly',
]
const TECHNIQUES = ['T1110', 'T1078', 'T1046', 'T1190', 'T1048']

describe('createRng', () => {
  it('is deterministic for a seed and differs across seeds', () => {
    const seq = (seed: number) =>
      Array.from(
        { length: 5 },
        (
          (r) => () =>
            r.next()
        )(createRng(seed)),
      )
    expect(seq(1)).toEqual(seq(1))
    expect(seq(1)).not.toEqual(seq(2))
  })

  it('stays in range', () => {
    const rng = createRng(7)
    for (let i = 0; i < 200; i++) {
      const n = rng.int(3, 9)
      expect(n).toBeGreaterThanOrEqual(3)
      expect(n).toBeLessThanOrEqual(9)
      expect(rng.next()).toBeLessThan(1)
    }
    expect(rng.hex(24)).toMatch(/^[0-9a-f]{24}$/)
  })
})

describe('sample dataset', () => {
  const ds = buildSampleDataset()

  it('is fully deterministic', () => {
    // JSON drops the `top` method, which would otherwise differ by identity.
    expect(JSON.stringify(buildSampleDataset())).toEqual(JSON.stringify(ds))
    expect(buildSampleDataset().top('user', 5)).toEqual(ds.top('user', 5))
    expect(JSON.stringify(buildSampleDataset(1))).not.toEqual(JSON.stringify(ds))
  })

  it('passes the same Zod schemas the live API will use', () => {
    expect(() => summarySchema.parse(ds.summary)).not.toThrow()
    expect(() => eventsSeriesSchema.parse(ds.events)).not.toThrow()
    expect(() => alertsSeriesSchema.parse(ds.alertsSeries)).not.toThrow()
    expect(() => topSchema.parse(ds.top('source_ip', 5))).not.toThrow()
    expect(() => topSchema.parse(ds.top('user', 5))).not.toThrow()
    expect(() => alertPageSchema.parse({ items: ds.alerts, next_cursor: null })).not.toThrow()
    expect(() => incidentPageSchema.parse({ items: ds.incidents, next_cursor: null })).not.toThrow()
  })

  it('uses only documentation-range or private IPs and example.com identities', () => {
    for (const a of ds.alerts) {
      for (const ip of a.entities.ips) expect(DOC_RANGES.some((r) => r.test(ip))).toBe(true)
      for (const u of a.entities.users)
        expect(u === 'root' || u === 'admin' || u.endsWith('@example.com')).toBe(true)
      for (const h of a.entities.hosts) expect(h.endsWith('.example.com')).toBe(true)
    }
  })

  it('uses documented rule keys and MITRE technique ids', () => {
    for (const a of ds.alerts) {
      expect(RULES).toContain(a.rule_key)
      expect(a.mitre.length).toBeGreaterThan(0)
      for (const m of a.mitre) expect(TECHNIQUES).toContain(m.technique_id)
    }
  })

  it('keeps every timestamp inside the window with first_seen <= last_seen', () => {
    const from = Date.parse(SAMPLE_WINDOW.from)
    const to = Date.parse(SAMPLE_WINDOW.to)
    for (const a of ds.alerts) {
      expect(Date.parse(a.first_seen)).toBeGreaterThanOrEqual(from)
      expect(Date.parse(a.first_seen)).toBeLessThanOrEqual(Date.parse(a.last_seen))
      expect(Date.parse(a.last_seen)).toBeLessThanOrEqual(to)
    }
    const hours = ds.events.points.map((p) => Date.parse(p.ts))
    expect(hours).toHaveLength(24)
    expect(hours[0]).toBe(from)
    expect(hours.at(-1)).toBe(to - 3_600_000)
  })

  it('has unique ids and sorts alerts newest first', () => {
    const ids = [...ds.alerts.map((a) => a.id), ...ds.incidents.map((i) => i.id)]
    expect(new Set(ids).size).toBe(ids.length)
    const seen = ds.alerts.map((a) => a.last_seen)
    expect(seen).toEqual([...seen].sort().reverse())
    expect(new Set(ds.incidents.map((i) => i.number)).size).toBe(ds.incidents.length)
  })

  it('derives every widget from the same alerts, so the numbers agree', () => {
    const s = ds.summary
    const sev = s.alerts_by_severity
    expect(sev.critical + sev.high + sev.medium + sev.low).toBe(ds.alerts.length)
    for (const level of ['critical', 'high', 'medium', 'low'] as const) {
      expect(sev[level]).toBe(ds.alertsSeries.points.reduce((n, p) => n + p[level], 0))
      expect(sev[level]).toBe(ds.alerts.filter((a) => a.severity === level).length)
    }
    const open = ds.alerts.filter((a) => ['new', 'acknowledged', 'in_progress'].includes(a.status))
    expect(s.open_alerts.value).toBe(open.length)
    expect(s.critical_alerts.value).toBe(open.filter((a) => a.severity === 'critical').length)
    expect(s.open_incidents.value).toBe(
      ds.incidents.filter((i) => !['resolved', 'closed'].includes(i.status)).length,
    )
    const total = ds.events.points.reduce((n, p) => n + p.value, 0)
    expect(s.events_per_minute.value).toBe(Math.round(total / 1440))
  })

  it('ties incidents to their alerts', () => {
    expect(ds.incidents.find((i) => i.number === 'INC-0007')?.alert_count).toBe(3)
    expect(ds.incidents.find((i) => i.number === 'INC-0008')?.alert_count).toBe(2)
    expect(ds.incidents.every((i) => i.alert_count > 0)).toBe(true)
  })

  it('tells a plausible story: a few criticals, a spike at the brute force, quiet nights', () => {
    expect(ds.summary.critical_alerts.value).toBe(2)
    expect(ds.summary.alerts_by_severity.critical).toBe(2)
    const events = ds.events.points.map((p) => p.value)
    expect(Math.max(...events)).toBeGreaterThan(Math.min(...events) * 2)
    expect(ds.summary.mttr_minutes.value).toBeGreaterThan(0)
  })

  it('ranks top lists in descending order and respects the limit', () => {
    const ips = ds.top('source_ip', 5)
    expect(ips.items).toHaveLength(5)
    const counts = ips.items.map((i) => i.count)
    expect(counts).toEqual([...counts].sort((a, b) => b - a))
    expect(ds.top('user', 3).items).toHaveLength(3)
  })

  it('previous-window values are plausible, non-negative integers', () => {
    for (const k of [
      ds.summary.events_per_minute,
      ds.summary.open_alerts,
      ds.summary.mttr_minutes,
    ]) {
      expect(Number.isInteger(k.previous)).toBe(true)
      expect(k.previous).toBeGreaterThan(0)
    }
  })
})

describe('sample source', () => {
  const source = (scenario?: Parameters<typeof parseSampleScenario>[0]) =>
    createSampleDashboardSource({ latencyMs: 0, scenario: parseSampleScenario(scenario) })

  async function failure(p: Promise<unknown>): Promise<ApiError> {
    try {
      await p
    } catch (e) {
      if (e instanceof ApiError) return e
      throw e
    }
    throw new Error('expected failure')
  }

  it('identifies itself as sample data', () => {
    expect(source().kind).toBe('sample')
  })

  it('serves limited recent alerts and incidents', async () => {
    const s = source()
    expect((await s.recentAlerts(8)).items).toHaveLength(8)
    expect((await s.recentIncidents(3)).items).toHaveLength(3)
  })

  it('empty scenario returns a quiet day', async () => {
    const s = source('empty')
    expect((await s.summary()).open_alerts.value).toBe(0)
    expect((await s.eventsSeries()).points).toEqual([])
    expect((await s.recentAlerts(8)).items).toEqual([])
    expect((await s.top('user', 5)).items).toEqual([])
  })

  it('error scenario always fails as a retryable network error', async () => {
    const error = await failure(source('error').summary())
    expect(error.kind).toBe('network')
    expect(error.retryable).toBe(true)
  })

  it('flaky scenario fails three times per endpoint, then recovers', async () => {
    const s = source('flaky')
    for (let i = 0; i < 3; i++) await failure(s.summary())
    await expect(s.summary()).resolves.toMatchObject({ open_alerts: expect.any(Object) as unknown })
    await failure(s.recentAlerts(5)) // endpoints are counted independently
  })

  it('honours cancellation', async () => {
    const slow: DashboardDataSource = createSampleDashboardSource({ latencyMs: 1000 })
    const controller = new AbortController()
    const pending = failure(slow.summary(controller.signal))
    controller.abort()
    expect((await pending).kind).toBe('aborted')
    const already = new AbortController()
    already.abort()
    expect((await failure(slow.summary(already.signal))).kind).toBe('aborted')
  })

  it('parses scenarios, defaulting to normal', () => {
    expect(parseSampleScenario('error')).toBe('error')
    expect(parseSampleScenario('bogus')).toBe('normal')
    expect(parseSampleScenario(null)).toBe('normal')
  })
})
