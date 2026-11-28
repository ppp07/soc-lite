import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '../test/server'
import { readApiConfig } from './config'
import { ApiError } from './errors'
import { getHealth } from './health'

describe('getHealth', () => {
  it('returns the validated health document', async () => {
    await expect(getHealth()).resolves.toEqual({
      status: 'ok',
      service: 'SOC-Lite',
      version: '0.1.0',
    })
  })

  it('rejects a response that is not the documented health shape', async () => {
    server.use(http.get('*/api/v1/health', () => HttpResponse.json({ status: 'degraded' })))
    await expect(getHealth()).rejects.toMatchObject({ kind: 'parse' })
  })

  it('surfaces an unreachable backend as a network ApiError', async () => {
    server.use(http.get('*/api/v1/health', () => HttpResponse.error()))
    const error = await getHealth().catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ kind: 'network', retryable: true })
  })
})

describe('readApiConfig', () => {
  it('defaults to the relative /api/v1 path', () => {
    expect(readApiConfig({}).baseUrl).toBe('/api/v1')
  })

  it('accepts paths and http(s) URLs and trims trailing slashes', () => {
    expect(readApiConfig({ VITE_API_BASE_URL: '/api/v1/' }).baseUrl).toBe('/api/v1')
    expect(readApiConfig({ VITE_API_BASE_URL: 'https://soc.example.com/api/v1//' }).baseUrl).toBe(
      'https://soc.example.com/api/v1',
    )
  })

  it('rejects values that are neither a path nor an http(s) URL', () => {
    expect(() => readApiConfig({ VITE_API_BASE_URL: 'javascript:alert(1)' })).toThrow(
      /Invalid VITE_API_BASE_URL/,
    )
    expect(() => readApiConfig({ VITE_API_BASE_URL: '' })).toThrow(/Invalid VITE_API_BASE_URL/)
  })
})
