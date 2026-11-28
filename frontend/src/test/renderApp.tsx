import { QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'

import type { DashboardDataSource } from '../api/dashboardSource'
import { createQueryClient } from '../api/queryClient'
import { DashboardSourceContext } from '../features/dashboard/dataSource'
import { appRoutes } from '../router'
import { setViewportWidth } from './shims'

export const DESKTOP = 1280
export const MOBILE = 390

interface RenderAppOptions {
  width?: number
  /** Inject a data source (e.g. a failing or empty one). Defaults to the instant sample source. */
  dashboardSource?: DashboardDataSource
}

/** Render the real route table in a memory router at a given path and viewport width. */
export function renderApp(path = '/', { width = DESKTOP, dashboardSource }: RenderAppOptions = {}) {
  setViewportWidth(width)
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] })
  // A fresh client per render, with retries off, so one test never leaks cache into another.
  const queryClient = createQueryClient({ retry: false })
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <DashboardSourceContext value={dashboardSource ?? null}>
        <RouterProvider router={router} />
      </DashboardSourceContext>
    </QueryClientProvider>,
  )
  return { router, queryClient, ...utils }
}
