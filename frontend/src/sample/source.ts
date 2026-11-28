import type { DashboardDataSource } from '../api/dashboardSource'
import { ApiError } from '../api/errors'
import { buildSampleDataset, SAMPLE_WINDOW, type SampleDataset } from './dataset'

/**
 * Behaviours a developer can switch on to see every state of the UI:
 *   normal  the full simulated day
 *   slow    responses take ~4 s, so loading skeletons stay visible
 *   empty   a quiet day with no data
 *   error   every request fails as if the server were unreachable
 *   flaky   the first three requests to each endpoint fail, so a manual Retry then succeeds
 */
export type SampleScenario = 'normal' | 'slow' | 'empty' | 'error' | 'flaky'

export const SAMPLE_SCENARIOS: readonly SampleScenario[] = [
  'normal',
  'slow',
  'empty',
  'error',
  'flaky',
]

export function parseSampleScenario(value: string | null | undefined): SampleScenario {
  return SAMPLE_SCENARIOS.find((s) => s === value) ?? 'normal'
}

export interface SampleSourceOptions {
  scenario?: SampleScenario
  /** Simulated network latency. Tests pass 0. */
  latencyMs?: number
  seed?: number
}

const FLAKY_FAILURES = 3
const SLOW_MS = 4000
const DEFAULT_LATENCY_MS = 350

function wait(ms: number, signal: AbortSignal | undefined): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new ApiError('aborted', 'The request was cancelled'))
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(new ApiError('aborted', 'The request was cancelled'))
      },
      { once: true },
    )
  })
}

const EMPTY_SUMMARY = {
  window: { ...SAMPLE_WINDOW },
  events_per_minute: { value: 0, previous: 0 },
  open_alerts: { value: 0, previous: 0 },
  critical_alerts: { value: 0, previous: 0 },
  open_incidents: { value: 0, previous: 0 },
  mttr_minutes: { value: 0, previous: 0 },
  alerts_by_severity: { critical: 0, high: 0, medium: 0, low: 0 },
}

/** A simulated DashboardDataSource. Its data is fictitious and never leaves this module. */
export function createSampleDashboardSource(
  options: SampleSourceOptions = {},
): DashboardDataSource {
  const scenario = options.scenario ?? 'normal'
  const latency = options.latencyMs ?? (scenario === 'slow' ? SLOW_MS : DEFAULT_LATENCY_MS)
  let dataset: SampleDataset | undefined
  const data = () => (dataset ??= buildSampleDataset(options.seed))
  const calls = new Map<string, number>()

  async function respond<T>(
    endpoint: string,
    signal: AbortSignal | undefined,
    produce: () => T,
  ): Promise<T> {
    await wait(latency, signal)
    if (scenario === 'error') throw new ApiError('network', 'Simulated outage (sample scenario)')
    if (scenario === 'flaky') {
      const n = (calls.get(endpoint) ?? 0) + 1
      calls.set(endpoint, n)
      if (n <= FLAKY_FAILURES) throw new ApiError('network', 'Simulated outage (sample scenario)')
    }
    return produce()
  }
  const empty = scenario === 'empty'

  return {
    kind: 'sample',
    summary: (signal) => respond('summary', signal, () => (empty ? EMPTY_SUMMARY : data().summary)),
    eventsSeries: (signal) =>
      respond('events', signal, () => (empty ? { ...data().events, points: [] } : data().events)),
    alertsSeries: (signal) =>
      respond('alerts-series', signal, () =>
        empty ? { ...data().alertsSeries, points: [] } : data().alertsSeries,
      ),
    top: (field, limit, signal) =>
      respond(`top-${field}`, signal, () =>
        empty ? { field, items: [] } : data().top(field, limit),
      ),
    recentAlerts: (limit, signal) =>
      respond('alerts', signal, () => ({
        items: empty ? [] : data().alerts.slice(0, limit),
        next_cursor: null,
      })),
    recentIncidents: (limit, signal) =>
      respond('incidents', signal, () => ({
        items: empty ? [] : data().incidents.slice(0, limit),
        next_cursor: null,
      })),
  }
}
