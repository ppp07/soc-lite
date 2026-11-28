import { z } from 'zod'

import { incidentStatusSchema, isoDateTime, page, severitySchema } from './common'

/** Row shape for GET /incidents (provisional; see common.ts). `owner` is a display name. */
export const incidentListItemSchema = z.object({
  id: z.string(),
  number: z.string().regex(/^INC-\d{4}$/),
  title: z.string(),
  severity: severitySchema,
  status: incidentStatusSchema,
  owner: z.string().nullable(),
  alert_count: z.number().int().nonnegative(),
  opened_at: isoDateTime,
  updated_at: isoDateTime,
})

export const incidentPageSchema = page(incidentListItemSchema)

export type IncidentListItem = z.infer<typeof incidentListItemSchema>
export type IncidentPage = z.infer<typeof incidentPageSchema>
