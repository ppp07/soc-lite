import { QueryClient } from '@tanstack/react-query'

import { isApiError } from './errors'

export const MAX_RETRIES = 2

/** Retry only transient failures, and only a couple of times. Never retry 4xx or bad data. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  return failureCount < MAX_RETRIES && isApiError(error) && error.retryable
}

/** Exponential back-off (1s, 2s, 4s, capped at 8s) with jitter so clients do not retry in lockstep. */
export function retryDelay(attempt: number, random: () => number = Math.random): number {
  return Math.min(1000 * 2 ** attempt, 8000) * (0.5 + random() * 0.5)
}

export function createQueryClient(overrides: { retry?: boolean } = {}): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: overrides.retry === false ? false : shouldRetry,
        retryDelay: (attempt: number) => retryDelay(attempt),
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      mutations: { retry: false },
    },
  })
}
