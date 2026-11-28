import { ROUTES, type RouteKey } from '../routes'
import { EmptyState } from './EmptyState'
import { PageHeader } from './PageHeader'

/** Temporary page body for sections whose real content lands on a later roadmap day. */
export function PlaceholderPage({ routeKey }: { routeKey: RouteKey }) {
  const route = ROUTES[routeKey]
  return (
    <>
      <PageHeader title={route.title} description={route.summary} />
      <EmptyState
        icon={route.icon}
        title="Not built yet"
        note={
          'adminArea' in route
            ? 'Access control is not implemented yet: this area is visible to everyone until sign-in and roles arrive.'
            : undefined
        }
      >
        {route.planned}
      </EmptyState>
    </>
  )
}
