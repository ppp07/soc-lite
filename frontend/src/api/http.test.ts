import { HttpResponse, delay, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { server } from '../test/server'
import { ApiError } from './errors'
import { buildUrl, request } from './http'

const schema = z.object({ ok: z.boolean() })
const BASE = '/api/v1'
const get = (path = '/thing', extra: { timeoutMs?: number; signal?: AbortSignal } = {}) =>
  request(path, { schema, baseUrl: BASE, ...extra })

async function failure(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise
  } catch (error) {
    if (error instanceof ApiError) return error
    throw error
  }
  throw new Error('expected the request to fail')
}

describe('buildUrl', () => {
  it('joins base and path once, regardless of slashes', () => {
    expect(buildUrl('/health', '/api/v1').pathname).toBe('/api/v1/health')
    expect(buildUrl('health', '/api/v1').pathname).toBe('/api/v1/health')
  })

  it('serialises query values and skips undefined', () => {
    const url = buildUrl('/alerts', '/api/v1', { limit: 5, q: 'a b&c', skip: undefined, on: true })
    expect(url.searchParams.get('limit')).toBe('5')
    expect(url.searchParams.get('q')).toBe('a b&c')
    expect(url.searchParams.get('on')).toBe('true')
    expect(url.searchParams.has('skip')).toBe(false)
    expect(url.search).toContain('q=a+b%26c')
  })
})

describe('request: success', () => {
  it('returns schema-validated data and sends a JSON Accept header', async () => {
    let accept: string | null = null
    server.use(
      http.get('*/api/v1/thing', ({ request: r }) => {
        accept = r.headers.get('accept')
        return HttpResponse.json({ ok: true })
      }),
    )
    await expect(get()).resolves.toEqual({ ok: true })
    expect(accept).toBe('application/json')
  })

  it('passes query parameters to the server', async () => {
    let search = ''
    server.use(
      http.get('*/api/v1/thing', ({ request: r }) => {
        search = new URL(r.url).search
        return HttpResponse.json({ ok: true })
      }),
    )
    await request('/thing', { schema, baseUrl: BASE, query: { limit: 3 } })
    expect(search).toBe('?limit=3')
  })
})

describe('request: HTTP failures', () => {
  const problem = (status: number, extra: object = {}) =>
    HttpResponse.json(
      {
        type: 'https://soc-lite.local/problems/validation-error',
        title: 'Validation failed',
        status,
        detail: 'limit must be <= 200',
        instance: '/api/v1/thing',
        request_id: 'req-body',
        ...extra,
      },
      { status, headers: { 'content-type': 'application/problem+json' } },
    )

  it('parses an RFC 7807 problem and keeps its request id', async () => {
    server.use(http.get('*/api/v1/thing', () => problem(422)))
    const error = await failure(get())
    expect(error.kind).toBe('problem')
    expect(error.status).toBe(422)
    expect(error.problem?.title).toBe('Validation failed')
    expect(error.requestId).toBe('req-body')
    expect(error.retryable).toBe(false)
  })

  it('falls back to the X-Request-ID header when the body has no request id', async () => {
    server.use(
      http.get('*/api/v1/thing', () =>
        HttpResponse.json(
          { type: 't', title: 'Bad gateway', status: 502 },
          { status: 502, headers: { 'X-Request-ID': 'req-header' } },
        ),
      ),
    )
    const error = await failure(get())
    expect(error.requestId).toBe('req-header')
    expect(error.retryable).toBe(true)
  })

  it('treats a non-problem error body as a plain HTTP error', async () => {
    server.use(
      http.get('*/api/v1/thing', () => HttpResponse.text('<html>oops</html>', { status: 500 })),
    )
    const error = await failure(get())
    expect(error.kind).toBe('http')
    expect(error.status).toBe(500)
    expect(error.problem).toBeUndefined()
    expect(error.retryable).toBe(true)
  })

  it.each([
    [400, false],
    [401, false],
    [404, false],
    [408, true],
    [429, true],
    [500, true],
    [503, true],
  ])('status %i retryable=%s', async (status, retryable) => {
    server.use(http.get('*/api/v1/thing', () => HttpResponse.json({}, { status })))
    expect((await failure(get())).retryable).toBe(retryable)
  })
})

describe('request: transport failures', () => {
  it('reports a network failure', async () => {
    server.use(http.get('*/api/v1/thing', () => HttpResponse.error()))
    const error = await failure(get())
    expect(error.kind).toBe('network')
    expect(error.retryable).toBe(true)
  })

  it('times out slow responses', async () => {
    server.use(
      http.get('*/api/v1/thing', async () => {
        await delay('infinite')
        return HttpResponse.json({ ok: true })
      }),
    )
    const error = await failure(get('/thing', { timeoutMs: 30 }))
    expect(error.kind).toBe('timeout')
    expect(error.retryable).toBe(true)
  })

  it('reports caller cancellation as aborted, not as a failure to retry', async () => {
    server.use(
      http.get('*/api/v1/thing', async () => {
        await delay('infinite')
        return HttpResponse.json({ ok: true })
      }),
    )
    const controller = new AbortController()
    const pending = failure(get('/thing', { signal: controller.signal }))
    setTimeout(() => {
      controller.abort()
    }, 10)
    const error = await pending
    expect(error.kind).toBe('aborted')
    expect(error.retryable).toBe(false)
  })

  it('does not even start when the signal is already aborted', async () => {
    const controller = new AbortController()
    controller.abort()
    expect((await failure(get('/thing', { signal: controller.signal }))).kind).toBe('aborted')
  })
})

describe('request: bad success bodies', () => {
  it('rejects invalid JSON as a parse error', async () => {
    server.use(http.get('*/api/v1/thing', () => HttpResponse.text('not json', { status: 200 })))
    const error = await failure(get())
    expect(error.kind).toBe('parse')
    expect(error.retryable).toBe(false)
  })

  it('rejects data that does not match the schema, without echoing the body', async () => {
    server.use(
      http.get('*/api/v1/thing', () => HttpResponse.json({ ok: 'yes', secret: 'hunter2' })),
    )
    const error = await failure(get())
    expect(error.kind).toBe('parse')
    expect(error.message).not.toContain('hunter2')
    expect(error.retryable).toBe(false)
  })
})
