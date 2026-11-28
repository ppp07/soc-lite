import { z } from 'zod'

const baseUrlSchema = z
  .string()
  .min(1)
  .refine((v) => v.startsWith('/') || /^https?:\/\//.test(v), {
    message: 'must be a path starting with "/" or an http(s) URL',
  })
  .transform((v) => v.replace(/\/+$/, ''))

export interface ApiConfig {
  /** Base URL of the REST API, without a trailing slash. */
  readonly baseUrl: string
}

/** Validates the (public) Vite env. Never put secrets in VITE_* variables: they ship in the bundle. */
export function readApiConfig(env: Record<string, unknown>): ApiConfig {
  const parsed = baseUrlSchema.safeParse(env['VITE_API_BASE_URL'] ?? '/api/v1')
  if (!parsed.success) {
    throw new Error(`Invalid VITE_API_BASE_URL: ${parsed.error.issues[0]?.message ?? 'unknown'}`)
  }
  return { baseUrl: parsed.data }
}

export const apiConfig: ApiConfig = readApiConfig(import.meta.env)
