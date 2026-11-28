import { createContext, useContext } from 'react'

import type { DashboardDataSource } from '../../api/dashboardSource'
// The ONLY place in the app that imports simulated data (enforced by ESLint and a test).
import { createSampleDashboardSource, parseSampleScenario, type SampleScenario } from '../../sample'

/**
 * `?sample=slow|empty|error|flaky` lets a developer see every UI state. It is honoured only in
 * development and test builds, so a production bundle always shows the normal sample day.
 */
function readScenario(): SampleScenario {
  if (!(import.meta.env.DEV || import.meta.env.MODE === 'test')) return 'normal'
  return parseSampleScenario(new URLSearchParams(window.location.search).get('sample'))
}

let defaultSource: DashboardDataSource | undefined
const getDefaultSource = (): DashboardDataSource =>
  (defaultSource ??= createSampleDashboardSource({
    scenario: readScenario(),
    // Tests resolve instantly; the app simulates a short network round-trip.
    ...(import.meta.env.MODE === 'test' ? { latencyMs: 0 } : {}),
  }))

/** Tests inject their own source through this context. */
export const DashboardSourceContext = createContext<DashboardDataSource | null>(null)

export const useDashboardSource = (): DashboardDataSource =>
  useContext(DashboardSourceContext) ?? getDefaultSource()
