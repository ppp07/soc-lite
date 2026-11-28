import { describe, expect, it } from 'vitest'

import { queryKeys } from './queryKeys'

describe('queryKeys', () => {
  it('are stable and JSON-serialisable', () => {
    const key = queryKeys.dashboard.top('sample', 'source_ip', 5, '24h')
    expect(JSON.parse(JSON.stringify(key))).toEqual(key)
    expect(queryKeys.dashboard.top('sample', 'source_ip', 5, '24h')).toEqual(key)
  })

  it('put params last, as one plain object', () => {
    expect(queryKeys.dashboard.summary('sample', '24h')).toEqual([
      'dashboard',
      'sample',
      'summary',
      { range: '24h' },
    ])
    expect(queryKeys.alerts.list('sample', { limit: 8 }).at(-1)).toEqual({ limit: 8 })
  })

  it('never let sample data share a cache entry with live data', () => {
    expect(queryKeys.dashboard.summary('sample', '24h')).not.toEqual(
      queryKeys.dashboard.summary('live', '24h'),
    )
    expect(queryKeys.alerts.list('sample', { limit: 8 })).not.toEqual(
      queryKeys.alerts.list('live', { limit: 8 }),
    )
  })

  it('make broader keys prefixes of narrower ones', () => {
    const all = queryKeys.dashboard.all('sample')
    for (const key of [
      queryKeys.dashboard.summary('sample', '24h'),
      queryKeys.dashboard.events('sample', '24h'),
      queryKeys.dashboard.alertsBySeverity('sample', '24h'),
      queryKeys.dashboard.top('sample', 'user', 5, '24h'),
    ]) {
      expect(key.slice(0, all.length)).toEqual([...all])
    }
  })

  it('distinguishes the two time-series metrics', () => {
    expect(queryKeys.dashboard.events('sample', '24h')).not.toEqual(
      queryKeys.dashboard.alertsBySeverity('sample', '24h'),
    )
  })
})
