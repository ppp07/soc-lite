import { Skeleton } from '../../../components/ui/Skeleton'
import { formatNumber } from '../../../lib/format'
import type { TopField } from '../../../api/queryKeys'
import { useTopList } from '../queries'
import { DataCard } from './DataCard'

interface RankedBarListProps {
  field: TopField
  title: string
  description: string
  /** What the count means, e.g. "events" or "alerts". */
  unit: string
  limit?: number
}

/** A ranked list with proportional bars: the right form for "who is on top", and no chart library needed. */
export function RankedBarList({ field, title, description, unit, limit = 5 }: RankedBarListProps) {
  const query = useTopList(field, limit)
  return (
    <DataCard
      title={title}
      description={description}
      query={query}
      isEmpty={(d) => d.items.length === 0}
      empty={{ title: 'Nothing to rank', message: 'No activity was recorded in this window.' }}
      skeleton={
        <div className="space-y-4">
          {Array.from({ length: limit }, (_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      }
    >
      {(top) => {
        const max = Math.max(...top.items.map((i) => i.count), 1)
        return (
          <ol aria-label={`${title}, by ${unit}`} className="space-y-3">
            {top.items.map((item) => (
              <li key={item.key}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate type-data text-text" title={item.key}>
                    {item.key}
                  </span>
                  <span className="shrink-0 text-sm text-text-muted tabular-nums">
                    {formatNumber(item.count)} <span className="text-text-subtle">{unit}</span>
                  </span>
                </div>
                <div aria-hidden="true" className="mt-1.5 h-1.5 rounded-xs bg-surface-sunken">
                  <div
                    className="h-full rounded-xs bg-accent"
                    style={{ width: `${(item.count / max) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ol>
        )
      }}
    </DataCard>
  )
}
