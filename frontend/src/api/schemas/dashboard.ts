import { z } from 'zod'

import { isoDateTime } from './common'

/** Dashboard contracts for /dashboard/* (provisional; see common.ts). */

const kpi = z.object({ value: z.number(), previous: z.number() })

/** GET /dashboard/summary */
export const summarySchema = z.object({
  window: z.object({ from: isoDateTime, to: isoDateTime }),
  events_per_minute: kpi,
  open_alerts: kpi,
  critical_alerts: kpi,
  open_incidents: kpi,
  /** Mean time to resolve, in minutes. */
  mttr_minutes: kpi,
  alerts_by_severity: z.object({
    critical: z.number().int().nonnegative(),
    high: z.number().int().nonnegative(),
    medium: z.number().int().nonnegative(),
    low: z.number().int().nonnegative(),
  }),
})

/** GET /dashboard/timeseries?metric=events */
export const eventsSeriesSchema = z.object({
  metric: z.literal('events'),
  interval: z.literal('hour'),
  points: z.array(z.object({ ts: isoDateTime, value: z.number().int().nonnegative() })),
})

/** GET /dashboard/timeseries?metric=alerts (stacked by severity) */
export const alertsSeriesSchema = z.object({
  metric: z.literal('alerts'),
  interval: z.literal('hour'),
  points: z.array(
    z.object({
      ts: isoDateTime,
      critical: z.number().int().nonnegative(),
      high: z.number().int().nonnegative(),
      medium: z.number().int().nonnegative(),
      low: z.number().int().nonnegative(),
    }),
  ),
})

/** GET /dashboard/top?field=source_ip|user */
export const topSchema = z.object({
  field: z.enum(['source_ip', 'user']),
  items: z.array(z.object({ key: z.string(), count: z.number().int().nonnegative() })),
})

export type DashboardSummary = z.infer<typeof summarySchema>
export type EventsSeries = z.infer<typeof eventsSeriesSchema>
export type AlertsSeries = z.infer<typeof alertsSeriesSchema>
export type TopList = z.infer<typeof topSchema>
