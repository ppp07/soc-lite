import { describe, expect, it } from 'vitest'

import { ApiError } from './errors'
import { MAX_RETRIES, createQueryClient, retryDelay, shouldRetry } from './queryClient'

describe('shouldRetry', () => {
  const transient = new ApiError('network', 'x')
  const permanent = new ApiError('problem', 'x', { status: 422 })

  it('retries transient failures up to the limit', () => {
    expect(shouldRetry(0, transient)).toBe(true)
    expect(shouldRetry(MAX_RETRIES - 1, transient)).toBe(true)
    expect(shouldRetry(MAX_RETRIES, transient)).toBe(false)
  })

  it('never retries client errors, bad data or foreign errors', () => {
    expect(shouldRetry(0, permanent)).toBe(false)
    expect(shouldRetry(0, new ApiError('parse', 'x'))).toBe(false)
    expect(shouldRetry(0, new Error('x'))).toBe(false)
  })
})

describe('retryDelay', () => {
  it('backs off exponentially with jitter, capped at 8 seconds', () => {
    expect(retryDelay(0, () => 1)).toBe(1000)
    expect(retryDelay(1, () => 1)).toBe(2000)
    expect(retryDelay(2, () => 1)).toBe(4000)
    expect(retryDelay(10, () => 1)).toBe(8000)
    expect(retryDelay(2, () => 0)).toBe(2000)
  })
})

describe('createQueryClient', () => {
  it('sets the documented defaults', () => {
    const defaults = createQueryClient().getDefaultOptions()
    expect(defaults.queries?.staleTime).toBe(30_000)
    expect(defaults.queries?.gcTime).toBe(300_000)
    expect(defaults.queries?.refetchOnWindowFocus).toBe(true)
    expect(defaults.queries?.refetchOnReconnect).toBe(true)
    expect(defaults.queries?.retry).toBe(shouldRetry)
    expect(defaults.mutations?.retry).toBe(false)
  })

  it('can disable retries for tests', () => {
    expect(createQueryClient({ retry: false }).getDefaultOptions().queries?.retry).toBe(false)
  })
})
