import { describe, expect, it } from 'vitest'

import { cx } from './cx'
import {
  formatMinutes,
  formatNumber,
  formatPercent,
  formatUtcDateTime,
  formatUtcLongDateTime,
  formatUtcTime,
} from './format'

describe('cx', () => {
  it('joins truthy parts and drops falsy ones', () => {
    expect(cx('a', false, null, undefined, 'b')).toBe('a b')
    expect(cx()).toBe('')
  })
})

describe('format', () => {
  it('formats numbers and percentages with thousands separators', () => {
    expect(formatNumber(12480)).toBe('12,480')
    expect(formatPercent(0.1234)).toBe('12%')
  })

  it('formats times in UTC regardless of the machine timezone', () => {
    expect(formatUtcTime('2026-11-28T09:14:00Z')).toBe('09:14')
    expect(formatUtcDateTime('2026-11-28T09:14:00Z')).toBe('28 Nov, 09:14')
    expect(formatUtcLongDateTime('2026-11-28T09:00:00Z')).toBe('28 Nov 2026, 09:00')
    expect(formatUtcTime('2026-11-28T23:59:00+02:00')).toBe('21:59')
  })

  it('formats durations in minutes', () => {
    expect(formatMinutes(45)).toBe('45 min')
    expect(formatMinutes(75)).toBe('1 h 15 min')
    expect(formatMinutes(120)).toBe('2 h')
  })
})
