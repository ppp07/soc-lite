import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { useId } from 'react'

import { Skeleton } from './Skeleton'

export interface StatDelta {
  direction: 'up' | 'down' | 'flat'
  /** Plain words after the direction, e.g. "12% vs previous 24 h". */
  text: string
}

interface StatTileProps {
  label: string
  value: string
  unit?: string
  delta?: StatDelta
  loading?: boolean
}

const DELTA_WORD = { up: 'Up', down: 'Down', flat: 'No change' } as const
const DELTA_ICON = { up: ArrowUp, down: ArrowDown, flat: Minus } as const

/**
 * A single headline number in the editorial display face. Direction is stated in words with an
 * arrow: it is deliberately neutral, because "up" is good for some metrics and bad for others.
 * Render inside a <dl>.
 */
export function StatTile({ label, value, unit, delta, loading = false }: StatTileProps) {
  const id = useId()
  const DeltaIcon = delta ? DELTA_ICON[delta.direction] : null
  return (
    <div
      className="rounded-lg border border-border bg-surface p-card shadow-sm"
      aria-busy={loading || undefined}
    >
      <dt id={id} className="type-overline text-text-subtle">
        {label}
      </dt>
      <dd className="mt-2">
        {loading ? (
          <div role="status">
            <span className="sr-only">Loading {label}…</span>
            <Skeleton className="h-9 w-24" />
            <Skeleton className="mt-3 h-4 w-32" />
          </div>
        ) : (
          <>
            <p className="type-numeral text-3xl text-text">
              {value}
              {unit ? <span className="ml-1 text-base text-text-muted">{unit}</span> : null}
            </p>
            {delta && DeltaIcon ? (
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-text-muted">
                <DeltaIcon className="size-3.5 shrink-0" aria-hidden="true" />
                <span>{`${DELTA_WORD[delta.direction]} ${delta.text}`}</span>
              </p>
            ) : null}
          </>
        )}
      </dd>
    </div>
  )
}
