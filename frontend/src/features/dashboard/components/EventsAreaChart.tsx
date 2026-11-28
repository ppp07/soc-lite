import { useId, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Skeleton } from '../../../components/ui/Skeleton'
import { Table, Td, Th, THead, Tr } from '../../../components/ui/Table'
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion'
import { formatNumber } from '../../../lib/format'
import { describeEvents, toEventRows, type EventRow } from '../metrics'
import { useEventsSeries } from '../queries'
import { ChartTableToggle } from './ChartTableToggle'
import { ChartTooltip } from './ChartTooltip'
import { DataCard } from './DataCard'

const compact = new Intl.NumberFormat('en-GB', { notation: 'compact' })
export const CHART_HEIGHT = 200
export const Y_AXIS_WIDTH = 44

const axisTick = { fill: 'var(--color-chart-axis)', fontSize: 12 }

function EventsChart({ rows }: { rows: EventRow[] }) {
  const reducedMotion = usePrefersReducedMotion()
  return (
    <ResponsiveContainer
      width="100%"
      height={CHART_HEIGHT}
      initialDimension={{ width: 640, height: CHART_HEIGHT }}
    >
      <AreaChart
        data={rows}
        margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        accessibilityLayer
        aria-label="Events per hour chart. Use the left and right arrow keys to move between hours. The same data is available as a table."
      >
        <CartesianGrid vertical={false} stroke="var(--color-chart-grid)" />
        <XAxis
          dataKey="label"
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: 'var(--color-border-strong)' }}
          interval="preserveStartEnd"
          minTickGap={28}
        />
        <YAxis
          width={Y_AXIS_WIDTH}
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => compact.format(v)}
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ stroke: 'var(--color-border-strong)' }}
          content={(props) => (
            <ChartTooltip active={props.active} payload={props.payload} unit="events" />
          )}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--color-chart-line)"
          strokeWidth={2}
          fill="var(--color-chart-area)"
          fillOpacity={0.9}
          activeDot={{
            r: 4,
            fill: 'var(--color-chart-line)',
            stroke: 'var(--color-surface)',
            strokeWidth: 2,
          }}
          isAnimationActive={!reducedMotion}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function EventsAreaChart() {
  const query = useEventsSeries()
  const [showTable, setShowTable] = useState(false)
  const contentId = useId()
  return (
    <DataCard
      title="Events per hour"
      description="Normalized security events, hour by hour"
      query={query}
      isEmpty={(d) => d.points.length === 0}
      empty={{
        title: 'No events in this window',
        message: 'Nothing was ingested during these 24 hours.',
      }}
      skeleton={<Skeleton className="h-[200px] w-full" />}
      footnote="Times in UTC"
      dataActions={
        <ChartTableToggle
          showTable={showTable}
          onToggle={() => setShowTable((v) => !v)}
          controlsId={contentId}
        />
      }
    >
      {(series) => {
        const rows = toEventRows(series)
        return (
          <figure id={contentId} className="m-0">
            {showTable ? (
              <Table caption="Events, hour by hour" regionClassName="max-h-72 overflow-y-auto">
                <THead>
                  <Tr>
                    <Th>Hour (UTC)</Th>
                    <Th numeric>Events</Th>
                  </Tr>
                </THead>
                <tbody>
                  {rows.map((r) => (
                    <Tr key={r.ts}>
                      <Td mono>{r.range}</Td>
                      <Td numeric>{formatNumber(r.value)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <EventsChart rows={rows} />
            )}
            <figcaption className="mt-3 text-sm text-text-muted">{describeEvents(rows)}</figcaption>
          </figure>
        )
      }}
    </DataCard>
  )
}
