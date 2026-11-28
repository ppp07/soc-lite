import { z } from 'zod'

import { request } from './http'

/** Matches the backend's `HealthResponse` (backend/app/modules/health/schemas.py). */
export const healthSchema = z.object({
  status: z.literal('ok'),
  service: z.string(),
  version: z.string(),
})

export type Health = z.infer<typeof healthSchema>

/** GET /api/v1/health: public, unauthenticated liveness. The only live endpoint used so far. */
export const getHealth = (signal?: AbortSignal): Promise<Health> =>
  request('/health', { schema: healthSchema, signal })
