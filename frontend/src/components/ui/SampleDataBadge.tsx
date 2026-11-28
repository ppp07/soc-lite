import { Circle } from 'lucide-react'

import { cx } from '../../lib/cx'

/**
 * Marks content as simulated. Deliberately neutral: it must never look like a "live" or
 * "healthy" indicator.
 */
export function SampleDataBadge({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-sm border border-border-strong bg-surface-sunken px-2 py-0.5 text-xs font-medium whitespace-nowrap text-text-muted',
        className,
      )}
    >
      <Circle className="size-3" aria-hidden="true" />
      Sample data
    </span>
  )
}
