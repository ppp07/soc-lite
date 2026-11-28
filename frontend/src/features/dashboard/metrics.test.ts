import { describe, expect, it } from 'vitest'

import { buildSampleDataset } from '../../sample'
import { deltaFrom, describeAlerts, describeEvents, toAlertRows, toEventRows } from './metrics'

describe('deltaFrom', () => {
  it('describes increases and decreases as rounded percentages', () => {
    expect(deltaFrom(120, 100)).toEqual({ direction: 'up', text: '20% vs prior 24 h' })
    expect(deltaFrom(80, 100)).toEqual({ direction: 'down', text: '20% vs prior 24 h' })
  })

  it('treats equal or sub-percent change as no change', () => {
    expect(deltaFrom(5, 5).direction).toBe('flat')
    expect(deltaFrom(1000, 1001).direction).toBe('flat')
  })

  it('handles a previous value of zero without dividing by it', () => {
    expect(deltaFrom(3, 0)).toEqual({ direction: 'up', text: 'from none in the prior 24 h' })
    expect(deltaFrom(0, 0).direction).toBe('flat')
  })
})

describe('chart data', () => {
  const ds = buildSampleDataset()
  const events = toEventRows(ds.events)
  const alerts = toAlertRows(ds.alertsSeries)

  it('labels every hour in UTC and gives a readable range', () => {
    expect(events).toHaveLength(24)
    expect(events[0]).toMatchObject({ label: '09:00', range: '09:00–10:00 UTC' })
    expect(events[23]?.range).toBe('08:00–09:00 UTC')
  })

  it('totals alerts per hour', () => {
    for (const r of alerts) expect(r.total).toBe(r.critical + r.high + r.medium + r.low)
    expect(alerts.reduce((n, r) => n + r.total, 0)).toBe(ds.alerts.length)
  })

  it('summarises the events chart in words (peak, low and average)', () => {
    const text = describeEvents(events)
    const peak = Math.max(...events.map((r) => r.value))
    expect(text).toContain(`Peak ${peak.toLocaleString('en-GB')} events`)
    expect(text).toMatch(/lowest .* at \d\d:00 UTC; average .* per hour\./)
  })

  it('summarises the alerts chart, naming the busiest hour and its severities', () => {
    const text = describeAlerts(alerts)
    expect(text).toContain(`${ds.alerts.length} alerts in total`)
    expect(text).toMatch(/busiest hour \d\d:00 UTC with \d/)
  })

  it('reports an empty window plainly', () => {
    expect(describeEvents([])).toBe('No events in this window.')
    expect(describeAlerts([])).toBe('No alerts in this window.')
  })
})
