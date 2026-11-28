import { cx } from '../../lib/cx'

/** Placeholder block. Give it the final content's dimensions so layout does not shift. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cx('animate-pulse rounded-md bg-surface-sunken', className)}
    />
  )
}
