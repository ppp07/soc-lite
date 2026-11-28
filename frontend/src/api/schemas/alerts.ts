import { z } from 'zod'

import { alertStatusSchema, isoDateTime, mitreRefSchema, page, severitySchema } from './common'

/** Row shape for GET /alerts (provisional; see common.ts). */
export const alertListItemSchema = z.object({
  id: z.string(),
  rule_key: z.string(),
  title: z.string(),
  severity: severitySchema,
  status: alertStatusSchema,
  first_seen: isoDateTime,
  last_seen: isoDateTime,
  count: z.number().int().nonnegative(),
  entities: z.object({
    ips: z.array(z.string()),
    users: z.array(z.string()),
    hosts: z.array(z.string()),
  }),
  mitre: z.array(mitreRefSchema),
})

export const alertPageSchema = page(alertListItemSchema)

export type AlertListItem = z.infer<typeof alertListItemSchema>
export type AlertPage = z.infer<typeof alertPageSchema>
