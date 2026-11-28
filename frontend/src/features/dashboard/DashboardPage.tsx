import { lazy, Suspense } from 'react'

import { PageHeader } from '../../components/PageHeader'
import { ROUTES } from '../../routes'
import { ChartCardFallback } from './components/ChartCardFallback'
import { KpiRow } from './components/KpiRow'
import { RankedBarList } from './components/RankedBarList'
import { RecentAlertsTable } from './components/RecentAlertsTable'
import { RecentIncidentsTable } from './components/RecentIncidentsTable'
import { SampleDataBanner } from './components/SampleDataBanner'
import { SeverityDistribution } from './components/SeverityDistribution'
import { SystemStatusCard } from './components/SystemStatusCard'

// Recharts is the heaviest dependency, so the two charts load as their own chunk while the
// figures, tables and lists render immediately.
const EventsAreaChart = lazy(() =>
  import('./components/EventsAreaChart').then((m) => ({ default: m.EventsAreaChart })),
)
const AlertsBySeverityChart = lazy(() =>
  import('./components/AlertsBySeverityChart').then((m) => ({ default: m.AlertsBySeverityChart })),
)

export default function DashboardPage() {
  const route = ROUTES.dashboard
  return (
    <>
      <PageHeader title={route.title} description={route.summary} />
      <SampleDataBanner />
      <KpiRow />
      <div className="mt-section grid gap-section xl:grid-cols-12">
        {/* Charts on the left; the composition and the one live check on the right. */}
        <div className="flex min-w-0 flex-col gap-section xl:col-span-8">
          <Suspense
            fallback={
              <ChartCardFallback
                title="Events per hour"
                description="Normalized security events, hour by hour"
              />
            }
          >
            <EventsAreaChart />
          </Suspense>
          <Suspense
            fallback={
              <ChartCardFallback
                title="Alerts per hour"
                description="New alerts, stacked by severity"
              />
            }
          >
            <AlertsBySeverityChart />
          </Suspense>
        </div>
        <div className="flex min-w-0 flex-col gap-section xl:col-span-4">
          <SeverityDistribution />
          <SystemStatusCard />
        </div>
        <div className="min-w-0 xl:col-span-6">
          <RankedBarList
            field="source_ip"
            title="Top source IPs"
            description="By events detected"
            unit="events"
          />
        </div>
        <div className="min-w-0 xl:col-span-6">
          <RankedBarList
            field="user"
            title="Top users"
            description="By alerts involving them"
            unit="alerts"
          />
        </div>
        {/* Wide tables get the full width so no column is hidden behind a scroll. */}
        <div className="min-w-0 xl:col-span-12">
          <RecentAlertsTable />
        </div>
        <div className="min-w-0 xl:col-span-12">
          <RecentIncidentsTable />
        </div>
      </div>
    </>
  )
}
