import { CircleCheck } from 'lucide-react'

import { useHealth } from '../../../api/useHealth'
import { Badge } from '../../../components/ui/Badge'
import { Skeleton } from '../../../components/ui/Skeleton'
import { formatUtcTime } from '../../../lib/format'
import { DataCard } from './DataCard'

/** The only real backend call so far: GET /api/v1/health. Everything else on this page is simulated. */
export function SystemStatusCard() {
  const query = useHealth()
  return (
    <DataCard
      title="System status"
      description="Backend API reachability"
      query={query}
      live
      empty={{ title: 'No status', message: 'The backend returned no status.' }}
      skeleton={<Skeleton className="h-16 w-full" />}
    >
      {(health) => (
        <div>
          <Badge tone="ok" className="text-sm">
            <CircleCheck className="size-4" aria-hidden="true" />
            Backend online
          </Badge>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-text-subtle">Service</dt>
            <dd className="text-text">{health.service}</dd>
            <dt className="text-text-subtle">Version</dt>
            <dd className="type-data text-text">{health.version}</dd>
            <dt className="text-text-subtle">Checked</dt>
            <dd className="text-text">
              {query.dataUpdatedAt ? (
                <time dateTime={new Date(query.dataUpdatedAt).toISOString()}>
                  {formatUtcTime(new Date(query.dataUpdatedAt).toISOString())} UTC
                </time>
              ) : (
                '—'
              )}
            </dd>
          </dl>
        </div>
      )}
    </DataCard>
  )
}
