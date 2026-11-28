import { describe, expect, it } from 'vitest'

import { SEVERITIES, SEVERITY_COLOR_VAR, SEVERITY_META } from './severity'

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

  it('uses only semantic severity tokens in class strings and chart variables', () => {
    for (const s of SEVERITIES) {
      const { badge, fill, text } = SEVERITY_META[s].classes
      expect(`${badge} ${fill} ${text}`).toMatch(new RegExp(`sev-${s}`))
      expect(`${badge} ${fill} ${text}`).not.toMatch(/#|rgb|\[/)
      expect(SEVERITY_COLOR_VAR[s]).toBe(`var(--color-sev-${s})`)
    }
  })
})
