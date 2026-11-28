import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'

import { installDomShims, setViewportWidth } from './shims'

installDomShims()

beforeEach(() => {
  setViewportWidth(1280) // desktop by default; tests opt in to mobile
  if (typeof document !== 'undefined') document.title = ''
})

afterEach(() => {
  cleanup()
})
