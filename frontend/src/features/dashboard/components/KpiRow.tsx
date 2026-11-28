import { describeError } from '../../../api/errors'
import { ErrorState } from '../../../components/ui/ErrorState'
import { StatTile } from '../../../components/ui/StatTile'
import { formatMinutes, formatNumber } from '../../../lib/format'
import { deltaFrom } from '../metrics'
import { useDashboardSummary } from '../queries'

const LABELS = [
  'Events per minute',
  'Open alerts',
  'Critical alerts',
  'Open incidents',
  'Time to resolve',
] as const

export function KpiRow() {
  const query = useDashboardSummary()
  const { data } = query

  if (query.isError && data === undefined) {
    const info = describeError(query.error)
    return (
      <ErrorState
        title={`Key figures unavailable: ${info.title}`}
        message={info.message}
        requestId={info.requestId}
        retrying={query.isFetching}
        onRetry={() => {
          void query.refetch()
        }}
      />
    )
  }

  const tiles = data
    ? [
        {
          label: LABELS[0],
          value: formatNumber(data.events_per_minute.value),
          delta: deltaFrom(data.events_per_minute.value, data.events_per_minute.previous),
        },
        {
          label: LABELS[1],
          value: formatNumber(data.open_alerts.value),
          delta: deltaFrom(data.open_alerts.value, data.open_alerts.previous),
        },
        {
          label: LABELS[2],
          value: formatNumber(data.critical_alerts.value),
          delta: deltaFrom(data.critical_alerts.value, data.critical_alerts.previous),
        },
        {
          label: LABELS[3],
          value: formatNumber(data.open_incidents.value),
          delta: deltaFrom(data.open_incidents.value, data.open_incidents.previous),
        },
        {
          label: LABELS[4],
          value: formatMinutes(data.mttr_minutes.value),
          delta: deltaFrom(data.mttr_minutes.value, data.mttr_minutes.previous),
        },
      ]
    : LABELS.map((label) => ({ label, value: '', delta: undefined }))

  return (
    <section aria-label="Key figures">
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5 [&>*:last-child]:col-span-2 md:[&>*:last-child]:col-span-1">
        {tiles.map((t) => (
          <StatTile
            key={t.label}
            label={t.label}
            value={t.value}
            loading={data === undefined}
            {...(t.delta ? { delta: t.delta } : {})}
          />
        ))}
      </dl>
    </section>
  )
}
