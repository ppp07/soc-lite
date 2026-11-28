import type { AlertPage } from './schemas/alerts'
import type { AlertsSeries, DashboardSummary, EventsSeries, TopList } from './schemas/dashboard'
import type { IncidentPage } from './schemas/incidents'
import type { DataSource, TopField } from './queryKeys'

/**
 * Everything the dashboard needs, behind one seam.
 *
 * Today the only implementation is simulated (src/sample). The backend has no alerts, incidents
 * or /dashboard/* endpoints yet, so there is deliberately NO live implementation: it will be
 * added here when those endpoints exist (Days 19-24), calling `request()` with the provisional
 * schemas, and the dashboard will not need to change.
 */
export interface DashboardDataSource {
  /** Drives the "Sample data" labelling: anything but `live` is shown as simulated. */
  readonly kind: DataSource
  summary(signal?: AbortSignal): Promise<DashboardSummary>
  eventsSeries(signal?: AbortSignal): Promise<EventsSeries>
  alertsSeries(signal?: AbortSignal): Promise<AlertsSeries>
  top(field: TopField, limit: number, signal?: AbortSignal): Promise<TopList>
  recentAlerts(limit: number, signal?: AbortSignal): Promise<AlertPage>
  recentIncidents(limit: number, signal?: AbortSignal): Promise<IncidentPage>
}
