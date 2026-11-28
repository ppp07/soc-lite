import { describe, expect, it } from 'vitest'

import { SEVERITIES, SEVERITY_CHART_STYLE, SEVERITY_META } from './severity'

describe('severity vocabulary', () => {
  it('gives every level a non-empty text label', () => {
    for (const s of SEVERITIES) expect(SEVERITY_META[s].label.trim().length).toBeGreaterThan(0)
  })

  it('never relies on colour alone: every level has a unique shape and label', () => {
    const shapes = SEVERITIES.map((s) => SEVERITY_META[s].shape)
    const labels = SEVERITIES.map((s) => SEVERITY_META[s].label)
    expect(new Set(shapes).size).toBe(SEVERITIES.length)
    expect(new Set(labels).size).toBe(SEVERITIES.length)
  })

  it('orders levels by rank from most to least severe', () => {
    const ranks = SEVERITIES.map((s) => SEVERITY_META[s].rank)
    expect(ranks).toEqual([...ranks].sort((a, b) => b - a))
    expect(new Set(ranks).size).toBe(ranks.length)
  })

  it('uses only semantic severity tokens, never raw colours', () => {
    for (const s of SEVERITIES) {
      const { badge, text, mark } = SEVERITY_META[s].classes
      const all = `${badge} ${text} ${mark} ${SEVERITY_CHART_STYLE[s].fill} ${SEVERITY_CHART_STYLE[s].stroke}`
      expect(all).toContain(`sev-${s}`)
      expect(all).not.toMatch(/#[0-9a-f]{3,6}|rgb\(|\[/i)
    }
  })
})

describe('severity accessibility regression: no gold-only (or solid-only) severity', () => {
  /** A class that paints the SOLID severity colour as text or as a background. */
  const solidTextOrBackground = (level: string) =>
    new RegExp(`(?:^|\\s)(?:[\\w:-]+:)?(?:text|bg)-sev-${level}(?=\\s|$)`)

  for (const level of SEVERITIES) {
    it(`${level}: no helper exposes the solid colour as text or as a lone background`, () => {
      const { badge, text, mark } = SEVERITY_META[level].classes
      for (const classes of [badge, text, mark]) {
        expect(classes).not.toMatch(solidTextOrBackground(level))
      }
    })

    it(`${level}: text is ink, badge is soft tint + ink, mark is fill + ink outline`, () => {
      const { badge, text, mark } = SEVERITY_META[level].classes
      expect(text).toBe(`text-sev-${level}-ink`)
      expect(badge).toBe(`bg-sev-${level}-soft text-sev-${level}-ink`)
      expect(mark).toBe(`fill-sev-${level} stroke-sev-${level}-ink`)
      expect(SEVERITY_CHART_STYLE[level].stroke).toBe(`var(--color-sev-${level}-ink)`)
    })
  }

  it('medium is a soft tint, dark ink label and an outlined diamond', () => {
    const medium = SEVERITY_META.medium
    expect(medium.shape).toBe('diamond')
    expect(medium.label).toBe('Medium')
    expect(medium.classes.badge).toBe('bg-sev-medium-soft text-sev-medium-ink')
    expect(medium.classes.mark).toContain('stroke-sev-medium-ink')
    expect(SEVERITY_CHART_STYLE.medium.fill).toBe('var(--color-sev-medium)')
    expect(SEVERITY_CHART_STYLE.medium.stroke).toBe('var(--color-sev-medium-ink)')
  })
})
