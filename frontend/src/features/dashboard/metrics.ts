import type { StatDelta } from '../../components/ui/StatTile'
import { formatNumber, formatUtcTime } from '../../lib/format'
import type { AlertsSeries, EventsSeries } from '../../api/schemas/dashboard'
import { SEVERITIES_BY_RANK } from './severityOrder'

/** Percentage change against the previous window, in words the UI can show next to an arrow. */
export function deltaFrom(value: number, previous: number): StatDelta {
  if (value === previous) return { direction: 'flat', text: 'vs prior 24 h' }
  if (previous === 0) return { direction: 'up', text: 'from none in the prior 24 h' }
  const pct = Math.round((Math.abs(value - previous) / previous) * 100)
  if (pct === 0) return { direction: 'flat', text: 'vs prior 24 h' }
  return { direction: value > previous ? 'up' : 'down', text: `${pct}% vs prior 24 h` }
}

const hourLabel = (ts: string): string => formatUtcTime(ts)
const hourRange = (ts: string): string => {
  const end = new Date(Date.parse(ts) + 3_600_000).toISOString()
  return `${formatUtcTime(ts)}–${formatUtcTime(end)} UTC`
}

export interface EventRow {
  ts: string
  label: string
  range: string
  value: number
}

export const toEventRows = (series: EventsSeries): EventRow[] =>
  series.points.map((p) => ({
    ts: p.ts,
    label: hourLabel(p.ts),
    range: hourRange(p.ts),
    value: p.value,
  }))

export interface AlertRow {
  ts: string
  label: string
  range: string
  critical: number
  high: number
  medium: number
  low: number
  total: number
}

export const toAlertRows = (series: AlertsSeries): AlertRow[] =>
  series.points.map((p) => ({
    ts: p.ts,
    label: hourLabel(p.ts),
    range: hourRange(p.ts),
    critical: p.critical,
    high: p.high,
    medium: p.medium,
    low: p.low,
    total: p.critical + p.high + p.medium + p.low,
  }))

/** Plain-language summary of the events chart, for screen readers and as a visible caption. */
export function describeEvents(rows: readonly EventRow[]): string {
  if (rows.length === 0) return 'No events in this window.'
  const peak = rows.reduce((a, b) => (b.value > a.value ? b : a))
  const low = rows.reduce((a, b) => (b.value < a.value ? b : a))
  const avg = Math.round(rows.reduce((n, r) => n + r.value, 0) / rows.length)
  return `Peak ${formatNumber(peak.value)} events at ${peak.label} UTC; lowest ${formatNumber(low.value)} at ${low.label} UTC; average ${formatNumber(avg)} per hour.`
}

export function describeAlerts(rows: readonly AlertRow[]): string {
  const total = rows.reduce((n, r) => n + r.total, 0)
  if (total === 0) return 'No alerts in this window.'
  const busiest = rows.reduce((a, b) => (b.total > a.total ? b : a))
  const parts = SEVERITIES_BY_RANK.filter((s) => busiest[s] > 0).map((s) => `${busiest[s]} ${s}`)
  return `${formatNumber(total)} alerts in total; busiest hour ${busiest.label} UTC with ${busiest.total} (${parts.join(', ')}).`
}
