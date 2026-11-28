import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'

/** Default handlers: a healthy backend. Tests override per case with `server.use(...)`. */
export const handlers = [
  http.get('*/api/v1/health', () =>
    HttpResponse.json({ status: 'ok', service: 'SOC-Lite', version: '0.1.0' }),
  ),
]

/** Node-only API mock for tests. It is never bundled or started in the browser. */
export const server = setupServer(...handlers)
