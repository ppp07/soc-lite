import { describe, expect, it } from 'vitest'

import { ApiError, describeError, isApiError } from './errors'

describe('ApiError.retryable', () => {
  it.each([
    ['network', undefined, true],
    ['timeout', undefined, true],
    ['aborted', undefined, false],
    ['parse', 200, false],
    ['problem', 422, false],
    ['problem', 503, true],
    ['http', 429, true],
    ['http', 404, false],
  ] as const)('%s (status %s) -> %s', (kind, status, expected) => {
    expect(new ApiError(kind, 'm', { status }).retryable).toBe(expected)
  })

  it('carries a cause and identifies itself', () => {
    const cause = new Error('boom')
    const error = new ApiError('network', 'failed', { cause })
    expect(error.cause).toBe(cause)
    expect(isApiError(error)).toBe(true)
    expect(isApiError(new Error('x'))).toBe(false)
  })
})

describe('describeError', () => {
  it('explains an unreachable backend in plain language', () => {
    const d = describeError(new ApiError('network', 'x'))
    expect(d.title).toMatch(/reach the server/i)
    expect(d.message).toMatch(/backend is running/i)
    expect(d.retryable).toBe(true)
  })

  it('explains timeouts, cancellations and malformed responses', () => {
    expect(describeError(new ApiError('timeout', 'x')).title).toMatch(/too long/i)
    expect(describeError(new ApiError('aborted', 'x')).title).toMatch(/cancelled/i)
    expect(describeError(new ApiError('parse', 'x')).title).toMatch(/unexpected response/i)
  })

  it('shows client-facing problem text for 4xx', () => {
    const d = describeError(
      new ApiError('problem', 'Validation failed', {
        status: 422,
        requestId: 'r1',
        problem: {
          type: 't',
          title: 'Validation failed',
          status: 422,
          detail: 'limit must be <= 200',
        },
      }),
    )
    expect(d.title).toBe('Validation failed')
    expect(d.message).toBe('limit must be <= 200')
    expect(d.requestId).toBe('r1')
    expect(d.retryable).toBe(false)
  })

  it('never echoes server detail for 5xx', () => {
    const d = describeError(
      new ApiError('problem', 'Internal', {
        status: 500,
        problem: {
          type: 't',
          title: 'Internal',
          status: 500,
          detail: 'Traceback: secret path /srv/app',
        },
      }),
    )
    expect(d.message).not.toContain('Traceback')
    expect(d.title).toMatch(/server had a problem/i)
  })

  it.each([502, 503, 504])('says the backend is unavailable for gateway status %i', (status) => {
    const d = describeError(new ApiError('http', 'x', { status }))
    expect(d.title).toBe('The backend is unavailable')
    expect(d.message).toMatch(/backend is running/i)
    expect(d.retryable).toBe(true)
  })

  it('maps access and missing-resource statuses', () => {
    expect(describeError(new ApiError('http', 'x', { status: 403 })).title).toBe('Access denied')
    expect(describeError(new ApiError('http', 'x', { status: 404 })).title).toBe('Not found')
  })

  it('handles non-ApiError values', () => {
    const d = describeError(new TypeError('x'))
    expect(d.title).toBe('Something went wrong')
    expect(describeError('string').retryable).toBe(true)
  })
})
