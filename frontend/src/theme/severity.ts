/**
 * Severity vocabulary shared by badges, charts and tables.
 *
 * Severity is never communicated by colour alone: every level has a text label AND a distinct
 * shape. Colour is a third, redundant cue. Components render `label` as visible text (or
 * an accessible name) and draw `shape`; they must not rely on the colour classes by themselves.
 */

export const SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'] as const
export type Severity = (typeof SEVERITIES)[number]

/** Geometric marks, distinguishable by outline at 12px without colour. */
export type SeverityShape = 'octagon' | 'triangle' | 'diamond' | 'square' | 'ring'

export interface SeverityMeta {
  readonly label: string
  /** 4 = most severe. Use for sorting; never derive order from the colour. */
  readonly rank: number
  readonly shape: SeverityShape
  /** Tailwind class strings are spelled out in full so the compiler can see them. */
  readonly classes: {
    /** Tinted badge: ink text on a soft background. */
    readonly badge: string
    /** Solid mark/fill (chart segments, shape glyph). */
    readonly fill: string
    /** Text colour for inline labels on the page surface. */
    readonly text: string
  }
}

export const SEVERITY_META: Readonly<Record<Severity, SeverityMeta>> = {
  critical: {
    label: 'Critical',
    rank: 4,
    shape: 'octagon',
    classes: {
      badge: 'bg-sev-critical-soft text-sev-critical-ink',
      fill: 'bg-sev-critical text-sev-critical',
      text: 'text-sev-critical-ink',
    },
  },
  high: {
    label: 'High',
    rank: 3,
    shape: 'triangle',
    classes: {
      badge: 'bg-sev-high-soft text-sev-high-ink',
      fill: 'bg-sev-high text-sev-high',
      text: 'text-sev-high-ink',
    },
  },
  medium: {
    label: 'Medium',
    rank: 2,
    shape: 'diamond',
    classes: {
      badge: 'bg-sev-medium-soft text-sev-medium-ink',
      fill: 'bg-sev-medium text-sev-medium',
      text: 'text-sev-medium-ink',
    },
  },
  low: {
    label: 'Low',
    rank: 1,
    shape: 'square',
    classes: {
      badge: 'bg-sev-low-soft text-sev-low-ink',
      fill: 'bg-sev-low text-sev-low',
      text: 'text-sev-low-ink',
    },
  },
  info: {
    label: 'Info',
    rank: 0,
    shape: 'ring',
    classes: {
      badge: 'bg-sev-info-soft text-sev-info-ink',
      fill: 'bg-sev-info text-sev-info',
      text: 'text-sev-info-ink',
    },
  },
}

/** CSS custom-property names for chart libraries that take colours as strings. */
export const SEVERITY_COLOR_VAR: Readonly<Record<Severity, string>> = {
  critical: 'var(--color-sev-critical)',
  high: 'var(--color-sev-high)',
  medium: 'var(--color-sev-medium)',
  low: 'var(--color-sev-low)',
  info: 'var(--color-sev-info)',
}
