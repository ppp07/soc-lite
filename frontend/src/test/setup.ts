import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'

import { server } from './server'
import { installDomShims, setViewportWidth } from './shims'

installDomShims()

// Any request without a handler fails the test: tests may not touch a real network.
beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
})

beforeEach(() => {
  setViewportWidth(1280) // desktop by default; tests opt in to mobile
  if (typeof document !== 'undefined') document.title = ''
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})
