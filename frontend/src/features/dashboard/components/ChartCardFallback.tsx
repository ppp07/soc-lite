import { useId } from 'react'

import { Card, CardBody, CardFooter, CardHeader } from '../../../components/ui/Card'
import { SampleDataBadge } from '../../../components/ui/SampleDataBadge'
import { Skeleton } from '../../../components/ui/Skeleton'
import { useDashboardSource } from '../dataSource'

/**
 * Placeholder shown while the chart code (Recharts, the heaviest dependency) downloads. Same
 * title, size and footer as the real card, so nothing jumps when it arrives.
 */
export function ChartCardFallback({ title, description }: { title: string; description: string }) {
  const titleId = useId()
  const source = useDashboardSource()
  return (
    <Card aria-labelledby={titleId} aria-busy="true" className="flex flex-col">
      <CardHeader title={title} titleId={titleId} description={description} />
      <CardBody className="flex-1">
        <div role="status">
          <span className="sr-only">Loading {title}…</span>
          <Skeleton className="h-[200px] w-full" />
        </div>
      </CardBody>
      <CardFooter>
        {source.kind !== 'live' ? <SampleDataBadge /> : null}
        <span>Times in UTC</span>
      </CardFooter>
    </Card>
  )
}
