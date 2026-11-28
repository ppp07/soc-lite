import { z } from 'zod'

/** RFC 7807 problem document as emitted by the backend (see docs/api.md, "Error format"). */
export const problemSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string().nullish(),
  instance: z.string().optional(),
  request_id: z.string().optional(),
  errors: z.array(z.record(z.string(), z.unknown())).optional(),
})

export type Problem = z.infer<typeof problemSchema>
