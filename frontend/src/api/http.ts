import type { z } from 'zod'

import { apiConfig } from './config'
import { ApiError } from './errors'
import { problemSchema } from './problem'

export const REQUEST_ID_HEADER = 'X-Request-ID'
export const DEFAULT_TIMEOUT_MS = 10_000

type QueryValue = string | number | boolean | undefined

export interface RequestOptions<T> {
  /** Every response is validated: the type of `T` is what the schema proves, not what we hope. */
  schema: z.ZodType<T>
  query?: Readonly<Record<string, QueryValue>>
  signal?: AbortSignal | undefined
  timeoutMs?: number
  baseUrl?: string
}

export function buildUrl(
  path: string,
  baseUrl: string,
  query?: Readonly<Record<string, QueryValue>>,
): URL {
  const joined = `${baseUrl}/${path.replace(/^\/+/, '')}`
  // Resolve against the page origin so relative bases ("/api/v1") also work outside a browser.
  const url = new URL(joined, globalThis.location?.href ?? 'http://localhost')
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }
  return url
}

/**
 * GET JSON from the SOC-Lite API.
 *
 * Failures are always an {@link ApiError} with a stable `kind`, so callers and the retry policy
 * never need to inspect fetch internals. Response bodies are never logged. Authentication is
 * not implemented yet; this is the single place a bearer token will be attached.
 */
export async function request<T>(path: string, options: RequestOptions<T>): Promise<T> {
  const {
    schema,
    query,
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    baseUrl = apiConfig.baseUrl,
  } = options
  const url = buildUrl(path, baseUrl, query)

  // One controller merges the caller's cancellation with our timeout. Built by hand (rather
  // than AbortSignal.any/timeout) so it behaves identically in every browser and test runtime.
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)
  const onCallerAbort = () => {
    controller.abort()
  }
  if (signal?.aborted) controller.abort()
  else signal?.addEventListener('abort', onCallerAbort, { once: true })

  const failure = (cause: unknown, requestId?: string): ApiError => {
    if (timedOut) return new ApiError('timeout', 'The request timed out', { cause, requestId })
    if (controller.signal.aborted)
      return new ApiError('aborted', 'The request was cancelled', { cause })
    return new ApiError('network', 'The request could not be completed', { cause, requestId })
  }

  try {
    let response: Response
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
        signal: controller.signal,
      })
    } catch (cause) {
      throw failure(cause)
    }

    const headerRequestId = response.headers.get(REQUEST_ID_HEADER) ?? undefined

    if (!response.ok) {
      let body: unknown
      try {
        body = await response.json()
      } catch {
        body = undefined
      }
      const problem = problemSchema.safeParse(body)
      if (problem.success) {
        throw new ApiError('problem', problem.data.title, {
          status: response.status,
          problem: problem.data,
          requestId: problem.data.request_id ?? headerRequestId,
        })
      }
      throw new ApiError('http', `HTTP ${response.status}`, {
        status: response.status,
        requestId: headerRequestId,
      })
    }

    let body: unknown
    try {
      body = await response.json()
    } catch (cause) {
      if (timedOut || controller.signal.aborted) throw failure(cause, headerRequestId)
      throw new ApiError('parse', 'The response was not valid JSON', {
        status: response.status,
        requestId: headerRequestId,
        cause,
      })
    }

    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      throw new ApiError('parse', 'The response did not match the expected schema', {
        status: response.status,
        requestId: headerRequestId,
        cause: parsed.error,
      })
    }
    return parsed.data
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onCallerAbort)
  }
}
