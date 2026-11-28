import { SEVERITY_META, type Severity } from '../../theme/severity'
import { cx } from '../../lib/cx'

interface SeverityMarkProps {
  severity: Severity
  className?: string
}

/**
 * The shape glyph for a severity. Decorative: the label next to it carries the meaning.
 * Every level has an ink outline; for medium (gold) that outline is what makes it legible.
 */
export function SeverityMark({ severity, className }: SeverityMarkProps) {
  const { shape, classes } = SEVERITY_META[severity]
  const shared = { strokeWidth: 1.25, strokeLinejoin: 'round' as const, className: classes.mark }
  return (
    <svg
      viewBox="0 0 16 16"
      className={cx('size-3.5 shrink-0', className)}
      aria-hidden="true"
      focusable="false"
      data-shape={shape}
    >
      {shape === 'octagon' && (
        <polygon points="5,1 11,1 15,5 15,11 11,15 5,15 1,11 1,5" {...shared} />
      )}
      {shape === 'triangle' && <polygon points="8,1.5 15,14 1,14" {...shared} />}
      {shape === 'diamond' && <polygon points="8,1 15,8 8,15 1,8" {...shared} />}
      {shape === 'square' && <rect x="2" y="2" width="12" height="12" rx="1.5" {...shared} />}
      {shape === 'ring' && (
        <>
          <circle cx="8" cy="8" r="6.5" {...shared} />
          <circle cx="8" cy="8" r="2.6" className="fill-sev-info-soft" />
        </>
      )}
    </svg>
  )
}
