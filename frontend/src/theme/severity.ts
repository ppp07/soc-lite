/**
 * Severity vocabulary shared by badges, charts and tables.
 *
 * Severity is never communicated by colour alone: every level has a text label AND a distinct
 * shape. Colour is a third, redundant cue. Components render `label` as visible text (or
 * an accessible name) and draw `shape`; they must not rely on the colour classes by themselves.
 *
 * The medium (gold) fill is below 3:1 on the page surfaces, so NO helper in this file exposes
 * a solid severity colour as text or as a lone background. The only ways to paint severity are:
 *   - `classes.badge`: soft tint background + dark ink label (text);
 *   - `classes.text`:  the dark ink colour for inline labels;
 *   - `classes.mark`:  an SVG shape whose fill is paired with an ink outline (stroke);
 *   - `SEVERITY_CHART_STYLE`: the same fill + ink stroke pair for chart segments.
 * Medium therefore always renders as: soft tint, dark ink label, outlined diamond.
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
    /** Tinted badge: dark ink text on a soft background. */
    readonly badge: string
    /** Ink text colour for inline labels on any surface. */
    readonly text: string
    /** SVG shape glyph: coloured fill with a mandatory ink outline. */
    readonly mark: string
  }
}

export const SEVERITY_META: Readonly<Record<Severity, SeverityMeta>> = {
  critical: {
    label: 'Critical',
    rank: 4,
    shape: 'octagon',
    classes: {
      badge: 'bg-sev-critical-soft text-sev-critical-ink',
      text: 'text-sev-critical-ink',
      mark: 'fill-sev-critical stroke-sev-critical-ink',
    },
  },
  high: {
    label: 'High',
    rank: 3,
    shape: 'triangle',
    classes: {
      badge: 'bg-sev-high-soft text-sev-high-ink',
      text: 'text-sev-high-ink',
      mark: 'fill-sev-high stroke-sev-high-ink',
    },
  },
  medium: {
    label: 'Medium',
    rank: 2,
    shape: 'diamond',
    classes: {
      badge: 'bg-sev-medium-soft text-sev-medium-ink',
      text: 'text-sev-medium-ink',
      mark: 'fill-sev-medium stroke-sev-medium-ink',
    },
  },
  low: {
    label: 'Low',
    rank: 1,
    shape: 'square',
    classes: {
      badge: 'bg-sev-low-soft text-sev-low-ink',
      text: 'text-sev-low-ink',
      mark: 'fill-sev-low stroke-sev-low-ink',
    },
  },
  info: {
    label: 'Info',
    rank: 0,
    shape: 'ring',
    classes: {
      badge: 'bg-sev-info-soft text-sev-info-ink',
      text: 'text-sev-info-ink',
      mark: 'fill-sev-info stroke-sev-info-ink',
    },
  },
}

export interface SeverityChartStyle {
  readonly fill: string
  /** Always the ink colour: the outline carries contrast when the fill alone cannot. */
  readonly stroke: string
}

/** Fill + outline pairs for chart libraries that take colours as strings (e.g. Recharts). */
export const SEVERITY_CHART_STYLE: Readonly<Record<Severity, SeverityChartStyle>> = {
  critical: { fill: 'var(--color-sev-critical)', stroke: 'var(--color-sev-critical-ink)' },
  high: { fill: 'var(--color-sev-high)', stroke: 'var(--color-sev-high-ink)' },
  medium: { fill: 'var(--color-sev-medium)', stroke: 'var(--color-sev-medium-ink)' },
  low: { fill: 'var(--color-sev-low)', stroke: 'var(--color-sev-low-ink)' },
  info: { fill: 'var(--color-sev-info)', stroke: 'var(--color-sev-info-ink)' },
}
