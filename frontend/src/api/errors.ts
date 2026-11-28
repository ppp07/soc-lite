import type { Problem } from './problem'

export type ApiErrorKind =
  /** The request never produced a response: offline, DNS, refused, CORS. */
  | 'network'
  | 'timeout'
  /** The caller cancelled (navigation, unmount). Not a failure to report. */
  | 'aborted'
  /** A non-2xx response whose body was not a problem document. */
  | 'http'
  /** A non-2xx response with an RFC 7807 problem document. */
  | 'problem'
  /** A 2xx response that was not valid JSON or did not match the expected schema. */
  | 'parse'

interface ApiErrorInit {
  status?: number | undefined
  problem?: Problem | undefined
  requestId?: string | undefined
  cause?: unknown
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | undefined
  readonly problem: Problem | undefined
  readonly requestId: string | undefined

  constructor(kind: ApiErrorKind, message: string, init: ApiErrorInit = {}) {
    super(message, init.cause === undefined ? undefined : { cause: init.cause })
    this.name = 'ApiError'
    this.kind = kind
    this.status = init.status
    this.problem = init.problem
    this.requestId = init.requestId
  }

  /** Worth trying again: transient transport failures, 408, 429 and 5xx. Never 4xx or bad data. */
  get retryable(): boolean {
    switch (this.kind) {
      case 'network':
      case 'timeout':
        return true
      case 'http':
      case 'problem':
        return (
          this.status !== undefined &&
          (this.status >= 500 || this.status === 429 || this.status === 408)
        )
      case 'aborted':
      case 'parse':
        return false
    }
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError

export interface ErrorDescription {
  title: string
  message: string
  retryable: boolean
  requestId?: string | undefined
}

/**
 * Turn any thrown value into plain-language text for the UI. Server text is only echoed for
 * 4xx problems (which are written for clients); 5xx detail is never shown, as it may be
 * internal. React escapes everything we return, so it is safe to render as text.
 */
export function describeError(error: unknown): ErrorDescription {
  if (!isApiError(error)) {
    return {
      title: 'Something went wrong',
      message: 'An unexpected error occurred.',
      retryable: true,
    }
  }
  const base = { retryable: error.retryable, requestId: error.requestId }
  switch (error.kind) {
    case 'network':
      return {
        ...base,
        title: 'Can’t reach the server',
        message: 'Check that the backend is running and that you are online, then try again.',
      }
    case 'timeout':
      return {
        ...base,
        title: 'The server took too long to respond',
        message: 'It may be busy. Try again in a moment.',
      }
    case 'aborted':
      return {
        ...base,
        title: 'Request cancelled',
        message: 'The request was cancelled before it finished.',
      }
    case 'parse':
      return {
        ...base,
        title: 'Unexpected response',
        message: 'The server replied in a format this app does not understand.',
      }
    case 'http':
    case 'problem': {
      const status = error.status ?? 0
      if (status === 502 || status === 503 || status === 504) {
        // From a reverse proxy or readiness check: the backend is down or not ready yet.
        return {
          ...base,
          title: 'The backend is unavailable',
          message:
            'The service could not be reached or is not ready. Check that the backend is running, then try again.',
        }
      }
      if (status >= 500) {
        return {
          ...base,
          title: 'The server had a problem',
          message: 'This is not caused by anything you did. Try again shortly.',
        }
      }
      if (status === 401 || status === 403) {
        return {
          ...base,
          title: 'Access denied',
          message: 'You do not have permission to view this.',
        }
      }
      if (status === 404) {
        return { ...base, title: 'Not found', message: 'The requested resource does not exist.' }
      }
      return {
        ...base,
        title: error.problem?.title ?? 'Request failed',
        message: error.problem?.detail ?? `The server rejected the request (HTTP ${status}).`,
      }
    }
  }
}
