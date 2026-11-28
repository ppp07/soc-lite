/**
 * Query-key conventions
 *  - Keys are built ONLY here, never inline in components.
 *  - Shape: [domain, ...scope, kind, params]. Params are one plain, serialisable object, last.
 *  - Broader keys are prefixes of narrower ones, so `queryKeys.dashboard.all(source)` invalidates
 *    every dashboard query for that source.
 *  - Data that can come from more than one source carries the source in its key, so cached
 *    sample data can never be served as live data.
 */

/** Where data came from. `sample` is simulated; `live` is the real API. */
export type DataSource = 'sample' | 'live'
export type DashboardRange = '24h'
export type TopField = 'source_ip' | 'user'

export const queryKeys = {
  system: {
    health: () => ['system', 'health'] as const,
  },
  dashboard: {
    all: (source: DataSource) => ['dashboard', source] as const,
    summary: (source: DataSource, range: DashboardRange) =>
      ['dashboard', source, 'summary', { range }] as const,
    events: (source: DataSource, range: DashboardRange) =>
      ['dashboard', source, 'timeseries', { metric: 'events', interval: 'hour', range }] as const,
    alertsBySeverity: (source: DataSource, range: DashboardRange) =>
      ['dashboard', source, 'timeseries', { metric: 'alerts', interval: 'hour', range }] as const,
    top: (source: DataSource, field: TopField, limit: number, range: DashboardRange) =>
      ['dashboard', source, 'top', { field, limit, range }] as const,
  },
  alerts: {
    list: (source: DataSource, params: { limit: number }) =>
      ['alerts', source, 'list', params] as const,
  },
  incidents: {
    list: (source: DataSource, params: { limit: number }) =>
      ['incidents', source, 'list', params] as const,
  },
} as const
