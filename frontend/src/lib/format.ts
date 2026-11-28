/** Display formatting. All times are shown in UTC: the platform ingests UTC and SOC teams span zones. */

const number = new Intl.NumberFormat('en-GB')
const percent = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 })
const utcTime = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'UTC',
})
const utcDateTime = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'UTC',
})
const utcLongDateTime = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'UTC',
})

export const formatNumber = (n: number): string => number.format(n)
export const formatPercent = (fraction: number): string => `${percent.format(fraction * 100)}%`
/** "09:14" */
export const formatUtcTime = (iso: string): string => utcTime.format(new Date(iso))
/** "28 Nov, 09:14" */
export const formatUtcDateTime = (iso: string): string => utcDateTime.format(new Date(iso))
/** "28 Nov 2026, 09:00" */
export const formatUtcLongDateTime = (iso: string): string => utcLongDateTime.format(new Date(iso))

/** 75 -> "1 h 15 min", 45 -> "45 min", 120 -> "2 h" */
export function formatMinutes(totalMinutes: number): string {
  const rounded = Math.round(totalMinutes)
  const h = Math.floor(rounded / 60)
  const m = rounded % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}
