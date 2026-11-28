import { RotateCw, TriangleAlert } from 'lucide-react'

import { Button } from './Button'

interface ErrorStateProps {
  title: string
  message: string
  /** Backend request ID, shown so a user can quote it to whoever runs the platform. */
  requestId?: string | undefined
  onRetry?: () => void
  retrying?: boolean
}

export function ErrorState({
  title,
  message,
  requestId,
  onRetry,
  retrying = false,
}: ErrorStateProps) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-md bg-coral-soft p-4">
      <TriangleAlert className="mt-0.5 size-5 shrink-0 text-coral-ink" aria-hidden="true" />
      <div className="min-w-0">
        <p className="font-semibold text-coral-ink">{title}</p>
        <p className="mt-0.5 text-text-muted">{message}</p>
        {requestId ? (
          <p className="mt-1 text-xs text-text-subtle">
            Request ID <code className="type-data">{requestId}</code>
          </p>
        ) : null}
        {onRetry ? (
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            loading={retrying}
            onClick={onRetry}
            leadingIcon={<RotateCw className="size-4" aria-hidden="true" />}
          >
            {retrying ? 'Retrying…' : 'Try again'}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
