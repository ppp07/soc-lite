import { TriangleAlert } from 'lucide-react'
import { isRouteErrorResponse, useRouteError } from 'react-router'

import { LinkButton } from '../components/ui/LinkButton'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { DEFAULT_PATH } from '../routes'

/** Error boundary for a page. Rendered inside the shell, so navigation stays available. */
export default function RouteErrorPage() {
  const error = useRouteError()
  const status = isRouteErrorResponse(error) ? error.status : undefined
  return (
    <>
      <PageHeader title="Something went wrong" eyebrow={status ? `Error ${status}` : 'Error'} />
      <EmptyState
        icon={TriangleAlert}
        title="This page could not be displayed"
        note={
          import.meta.env.DEV && error instanceof Error ? (
            <code className="type-data">{error.message}</code>
          ) : undefined
        }
      >
        The problem has been contained to this page. Choose another section, or go back to the
        dashboard.
      </EmptyState>
      <div className="mt-stack">
        <LinkButton to={DEFAULT_PATH}>Back to the dashboard</LinkButton>
      </div>
    </>
  )
}
