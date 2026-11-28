// @vitest-environment node
/// <reference types="node" />
import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

// Read from disk: Vitest runs with `css: false`, which empties `?raw` CSS imports.
const tokensCss = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8')

/** Resolve --name: value declarations from tokens.css (later declarations win). */
function parseTokens(css: string): Map<string, string> {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const map = new Map<string, string>()
  for (const m of stripped.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)) {
    const [, name, value] = m
    if (name && value) map.set(name, value.trim())
  }
  return map
}

const tokens = parseTokens(tokensCss)

function resolve(name: string, seen = new Set<string>()): string {
  if (seen.has(name)) throw new Error(`Circular token reference: ${name}`)
  const value = tokens.get(name)
  if (value === undefined) throw new Error(`Unknown token: ${name}`)
  const ref = /^var\((--[\w-]+)\)$/.exec(value)
  return ref?.[1] ? resolve(ref[1], new Set(seen).add(name)) : value
}

function channel(c: number): number {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string): number {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error(`Expected #rrggbb, got "${hex}"`)
  const n = parseInt(hex.slice(1), 16)
  return (
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  )
}

/** WCAG 2.x contrast ratio between two colour tokens. */
function ratio(fg: string, bg: string): number {
  const a = luminance(resolve(`--color-${fg}`))
  const b = luminance(resolve(`--color-${bg}`))
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

const SURFACES = ['bg', 'surface', 'surface-raised', 'surface-sunken'] as const
const SEVERITY_LEVELS = ['critical', 'high', 'medium', 'low', 'info'] as const

describe('token resolution', () => {
  it('resolves every colour token to a #rrggbb value', () => {
    const names = [...tokens.keys()].filter(
      (n) =>
        n.startsWith('--color-') &&
        !['--color-transparent', '--color-current', '--color-overlay'].includes(n),
    )
    expect(names.length).toBeGreaterThan(40)
    for (const n of names) expect(resolve(n)).toMatch(/^#[0-9a-f]{6}$/i)
  })
})

describe('WCAG AA: body text (>= 4.5:1)', () => {
  for (const surface of SURFACES) {
    for (const text of ['text', 'text-muted', 'text-subtle', 'accent-ink', 'coral-ink'] as const) {
      it(`${text} on ${surface}`, () => {
        expect(ratio(text, surface)).toBeGreaterThanOrEqual(4.5)
      })
    }
  }

  it('text-inverse on accent, accent-hover, accent-active and coral buttons', () => {
    expect(ratio('accent-fg', 'accent')).toBeGreaterThanOrEqual(4.5)
    expect(ratio('accent-fg', 'accent-hover')).toBeGreaterThanOrEqual(4.5)
    expect(ratio('accent-fg', 'accent-active')).toBeGreaterThanOrEqual(4.5)
    expect(ratio('coral-fg', 'coral')).toBeGreaterThanOrEqual(4.5)
  })

  it('ink on soft tints for accent and coral', () => {
    expect(ratio('accent-ink', 'accent-soft')).toBeGreaterThanOrEqual(4.5)
    expect(ratio('accent-ink', 'accent-soft-hover')).toBeGreaterThanOrEqual(4.5)
    expect(ratio('coral-ink', 'coral-soft')).toBeGreaterThanOrEqual(4.5)
  })
})

describe('WCAG AA: severity and status text (>= 4.5:1)', () => {
  for (const level of SEVERITY_LEVELS) {
    it(`sev-${level}-ink on its soft tint and on every surface`, () => {
      expect(ratio(`sev-${level}-ink`, `sev-${level}-soft`)).toBeGreaterThanOrEqual(4.5)
      for (const surface of SURFACES) {
        expect(ratio(`sev-${level}-ink`, surface)).toBeGreaterThanOrEqual(4.5)
      }
    })
  }

  it('status-ok-ink on its soft tint and on every surface', () => {
    expect(ratio('status-ok-ink', 'status-ok-soft')).toBeGreaterThanOrEqual(4.5)
    for (const surface of SURFACES) {
      expect(ratio('status-ok-ink', surface)).toBeGreaterThanOrEqual(4.5)
    }
  })
})

describe('WCAG AA: non-text UI (>= 3:1)', () => {
  it('focus ring is visible on every surface and on the accent tint', () => {
    for (const surface of [...SURFACES, 'accent-soft'] as const) {
      expect(ratio('focus', surface)).toBeGreaterThanOrEqual(3)
    }
  })

  it('control borders are visible on every surface', () => {
    for (const surface of SURFACES) {
      expect(ratio('border-control', surface)).toBeGreaterThanOrEqual(3)
    }
  })

  it('accent and coral marks are visible on every surface', () => {
    for (const surface of SURFACES) {
      expect(ratio('accent', surface)).toBeGreaterThanOrEqual(3)
      expect(ratio('coral', surface)).toBeGreaterThanOrEqual(3)
    }
  })

  for (const level of SEVERITY_LEVELS.filter((l) => l !== 'medium')) {
    it(`sev-${level} fill is visible on every surface`, () => {
      for (const surface of SURFACES) {
        expect(ratio(`sev-${level}`, surface)).toBeGreaterThanOrEqual(3)
      }
    })
  }

  it('status-ok fill is visible on every surface', () => {
    for (const surface of SURFACES) {
      expect(ratio('status-ok', surface)).toBeGreaterThanOrEqual(3)
    }
  })

  /*
   * Documented exception: the medium (gold) fill sits below 3:1 on cream. Gold cannot be darker
   * without collapsing into the "high" orange for colour-blind readers (checked with the dataviz
   * palette validator). It therefore ALWAYS ships with a text label and an outlined diamond
   * (stroke in sev-medium-ink), which carry the contrast. We still require >= 2:1.
   */
  it('sev-medium fill stays >= 2:1 and relies on label + outlined shape', () => {
    for (const surface of SURFACES) {
      expect(ratio('sev-medium', surface)).toBeGreaterThanOrEqual(2)
    }
    expect(ratio('sev-medium-ink', 'surface')).toBeGreaterThanOrEqual(4.5)
  })
})
