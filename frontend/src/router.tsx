import { lazy } from 'react'
import { Navigate, createBrowserRouter, type RouteObject } from 'react-router'

import AppShell from './layouts/AppShell'
import NotFoundPage from './pages/NotFoundPage'
import RootErrorPage from './pages/RootErrorPage'
import RouteErrorPage from './pages/RouteErrorPage'
import { DEFAULT_PATH, ROUTES, type RouteKey } from './routes'

// Pages are code-split: heavier pages (charts, tables) won't weigh on first load.
const pages: Record<RouteKey, ReturnType<typeof lazy>> = {
  dashboard: lazy(() => import('./features/dashboard/DashboardPage')),
  alerts: lazy(() => import('./features/alerts/AlertsPage')),
  incidents: lazy(() => import('./features/incidents/IncidentsPage')),
  events: lazy(() => import('./features/events/EventsPage')),
  rules: lazy(() => import('./features/rules/RulesPage')),
  response: lazy(() => import('./features/response/ResponsePage')),
  ml: lazy(() => import('./features/ml/MlPage')),
  audit: lazy(() => import('./features/audit/AuditPage')),
  admin: lazy(() => import('./features/admin/AdminPage')),
}

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <AppShell />,
    // Failures in the shell itself: a standalone screen, since the shell can't be trusted.
    errorElement: <RootErrorPage />,
    children: [
      {
        // Pathless layout whose error boundary renders inside the shell's <Outlet>, so a
        // crashing page keeps the navigation working.
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, element: <Navigate to={DEFAULT_PATH} replace /> },
          ...(Object.keys(ROUTES) as RouteKey[]).map((key) => {
            const Page = pages[key]
            return { path: ROUTES[key].path.slice(1), element: <Page /> }
          }),
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]

export const createAppRouter = () => createBrowserRouter(appRoutes)
