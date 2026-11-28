import type { DashboardDataSource } from '../api/dashboardSource'
import { ApiError } from '../api/errors'
import { createSampleDashboardSource } from '../sample'

type Method =
  'summary' | 'eventsSeries' | 'alertsSeries' | 'top' | 'recentAlerts' | 'recentIncidents'

export const instantSource = (): DashboardDataSource =>
  createSampleDashboardSource({ latencyMs: 0 })

const outage = () => new ApiError('network', 'down')

/** Make the named endpoints fail. `times` limits how many calls fail before recovering. */
export function failing(
  base: DashboardDataSource,
  methods: readonly Method[],
  times = Infinity,
): DashboardDataSource {
  const left = new Map(methods.map((m) => [m, times]))
  const wrap =
    <A extends unknown[], R>(name: Method, fn: (...a: A) => Promise<R>) =>
    (...args: A): Promise<R> => {
      const remaining = left.get(name) ?? 0
      if (remaining > 0) {
        left.set(name, remaining - 1)
        return Promise.reject(outage())
      }
      return fn(...args)
    }
  return {
    kind: base.kind,
    summary: wrap('summary', base.summary.bind(base)),
    eventsSeries: wrap('eventsSeries', base.eventsSeries.bind(base)),
    alertsSeries: wrap('alertsSeries', base.alertsSeries.bind(base)),
    top: wrap('top', base.top.bind(base)),
    recentAlerts: wrap('recentAlerts', base.recentAlerts.bind(base)),
    recentIncidents: wrap('recentIncidents', base.recentIncidents.bind(base)),
  }
}

/** Hold every response until `release()` is called, so loading states can be observed. */
export function gated(base: DashboardDataSource): {
  source: DashboardDataSource
  release: () => void
} {
  let release = () => undefined as void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  const hold =
    <A extends unknown[], R>(fn: (...a: A) => Promise<R>) =>
    async (...args: A): Promise<R> => {
      await gate
      return fn(...args)
    }
  return {
    release,
    source: {
      kind: base.kind,
      summary: hold(base.summary.bind(base)),
      eventsSeries: hold(base.eventsSeries.bind(base)),
      alertsSeries: hold(base.alertsSeries.bind(base)),
      top: hold(base.top.bind(base)),
      recentAlerts: hold(base.recentAlerts.bind(base)),
      recentIncidents: hold(base.recentIncidents.bind(base)),
    },
  }
}

/** The same simulated data, but claiming to come from the real API. */
export const asLive = (base: DashboardDataSource): DashboardDataSource => ({
  ...base,
  kind: 'live',
})
