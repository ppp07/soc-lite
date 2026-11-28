import { render } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'

import { appRoutes } from '../router'
import { setViewportWidth } from './shims'

export const DESKTOP = 1280
export const MOBILE = 390

/** Render the real route table in a memory router at a given path and viewport width. */
export function renderApp(path = '/', width = DESKTOP) {
  setViewportWidth(width)
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] })
  const utils = render(<RouterProvider router={router} />)
  return { router, ...utils }
}
