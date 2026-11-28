import type { UseQueryResult } from '@tanstack/react-query'
import { Inbox } from 'lucide-react'
import { useId, type ReactNode } from 'react'

import { describeError } from '../../../api/errors'
import { Badge } from '../../../components/ui/Badge'
import { Card, CardBody, CardFooter, CardHeader } from '../../../components/ui/Card'
import { ErrorState } from '../../../components/ui/ErrorState'
import { SampleDataBadge } from '../../../components/ui/SampleDataBadge'
import { cx } from '../../../lib/cx'
import { useDashboardSource } from '../dataSource'

interface DataCardProps<T> {
  title: string
  description?: string
  query: UseQueryResult<T>
  /** Decides whether a successful response counts as "nothing to show". */
  isEmpty?: (data: T) => boolean
  empty: { title: string; message: string }
  /** Shown while the first load is pending. Match the final layout's size to avoid layout shift. */
  skeleton: ReactNode
  /** Always shown, e.g. a link to the full list. */
  actions?: ReactNode
  /** Shown only when there is data to act on, e.g. a chart's table toggle. */
  dataActions?: ReactNode
  /** Short note in the footer, e.g. "Times in UTC". */
  footnote?: string
  /** Real backend data (not simulated): shows a "Live check" label instead of "Sample data". */
  live?: boolean
  className?: string
  children: (data: T) => ReactNode
}

/**
 * One card, every state. Each card owns its own query, so a failure in one never affects the
 * others, and its Retry button re-runs only that request.
 *   pending  -> announced skeleton        error -> plain-language message + Retry
 *   empty    -> a specific message        data  -> the content, with a quiet "Refreshing…"
 */
export function DataCard<T>({
  title,
  description,
  query,
  isEmpty,
  empty,
  skeleton,
  actions,
  dataActions,
  footnote,
  live = false,
  className,
  children,
}: DataCardProps<T>) {
  const titleId = useId()
  const source = useDashboardSource()
  const sample = !live && source.kind !== 'live'
  const { data } = query

  let body: ReactNode
  if (query.isPending) {
    body = (
      <div role="status">
        <span className="sr-only">Loading {title}…</span>
        {skeleton}
      </div>
    )
  } else if (data === undefined) {
    const info = describeError(query.error)
    body = (
      <ErrorState
        title={info.title}
        message={info.message}
        requestId={info.requestId}
        retrying={query.isFetching}
        onRetry={() => {
          void query.refetch()
        }}
      />
    )
  } else if (isEmpty?.(data)) {
    body = (
      <div className="flex items-start gap-3 rounded-md bg-surface-sunken p-4">
        <Inbox className="mt-0.5 size-5 shrink-0 text-text-subtle" aria-hidden="true" />
        <div>
          <p className="font-medium text-text">{empty.title}</p>
          <p className="mt-0.5 text-text-muted">{empty.message}</p>
        </div>
      </div>
    )
  } else {
    body = children(data)
  }

  const hasData = data !== undefined && !isEmpty?.(data)
  const refreshing = !query.isPending && query.isFetching && data !== undefined
  const refreshFailed = query.isRefetchError && data !== undefined

  return (
    <Card
      aria-labelledby={titleId}
      aria-busy={query.isPending || undefined}
      className={cx('flex flex-col', className)}
    >
      <CardHeader
        title={title}
        titleId={titleId}
        description={description}
        actions={
          actions || (hasData && dataActions) ? (
            <>
              {actions}
              {hasData ? dataActions : null}
            </>
          ) : undefined
        }
      />
      <CardBody className="flex-1">{body}</CardBody>
      <CardFooter>
        {sample ? <SampleDataBadge /> : null}
        {live ? <Badge tone="neutral">Live check</Badge> : null}
        {footnote ? <span>{footnote}</span> : null}
        <span aria-live="polite" className="ml-auto">
          {refreshing ? 'Refreshing…' : null}
          {refreshFailed && !refreshing ? 'Could not refresh. Showing earlier data.' : null}
        </span>
      </CardFooter>
    </Card>
  )
}
