import { z } from 'zod'

/**
 * PROVISIONAL CONTRACTS
 *
 * The backend does not implement alerts, incidents or dashboard endpoints yet. The schemas in
 * this folder are the frontend's proposal, derived from docs/api.md and docs/database-schema.md,
 * and will be reconciled with the real OpenAPI spec when those endpoints land (Days 19-24).
 * Field names are snake_case and timestamps are ISO-8601 UTC, per docs/api.md.
 */

export const isoDateTime = z.iso.datetime()

/** Alert severities as stored (docs/database-schema.md). `info` exists only in the UI vocabulary. */
export const severitySchema = z.enum(['critical', 'high', 'medium', 'low'])
export type AlertSeverity = z.infer<typeof severitySchema>

export const alertStatusSchema = z.enum([
  'new',
  'acknowledged',
  'in_progress',
  'resolved',
  'false_positive',
])

export const incidentStatusSchema = z.enum([
  'open',
  'investigating',
  'contained',
  'resolved',
  'closed',
])

export const mitreRefSchema = z.object({
  tactic_id: z.string(),
  tactic: z.string(),
  technique_id: z.string(),
  technique: z.string(),
  subtechnique_id: z.string().optional(),
})

/** Cursor pagination envelope (docs/api.md): `{items, next_cursor}`. */
export const page = <T extends z.ZodType>(item: T) =>
  z.object({ items: z.array(item), next_cursor: z.string().nullable() })
