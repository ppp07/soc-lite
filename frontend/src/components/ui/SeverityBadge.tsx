import { SEVERITY_META, type Severity } from '../../theme/severity'
import { cx } from '../../lib/cx'
import { SeverityMark } from './SeverityMark'

interface SeverityBadgeProps {
  severity: Severity
  className?: string
}

/**
 * Soft tint + dark ink label + outlined shape. Severity is never colour alone: the text is the
 * accessible name and the shape is distinct per level.
 */
export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const { label, classes } = SEVERITY_META[severity]
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        classes.badge,
        className,
      )}
    >
      <SeverityMark severity={severity} />
      {label}
    </span>
  )
}
