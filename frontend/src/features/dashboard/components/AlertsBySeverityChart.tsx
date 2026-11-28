import { useId, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Skeleton } from '../../../components/ui/Skeleton'
import { SeverityBadge } from '../../../components/ui/SeverityBadge'
import { Table, Td, Th, THead, Tr } from '../../../components/ui/Table'
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion'
import { formatNumber } from '../../../lib/format'
import { SEVERITY_CHART_STYLE } from '../../../theme/severity'
import { describeAlerts, toAlertRows, type AlertRow } from '../metrics'
import { useAlertsSeries } from '../queries'
import { SEVERITIES_BY_RANK } from '../severityOrder'
import { CHART_HEIGHT, Y_AXIS_WIDTH } from './EventsAreaChart'
import { ChartTableToggle } from './ChartTableToggle'
import { ChartTooltip } from './ChartTooltip'
import { DataCard } from './DataCard'
import { SeverityLegend } from './SeverityLegend'

const axisTick = { fill: 'var(--color-chart-axis)', fontSize: 12 }

function AlertsChart({ rows }: { rows: AlertRow[] }) {
  const reducedMotion = usePrefersReducedMotion()
  return (
    <ResponsiveContainer
      width="100%"
      height={CHART_HEIGHT}
      initialDimension={{ width: 640, height: CHART_HEIGHT }}
    >
      <BarChart
        data={rows}
        margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        accessibilityLayer
        aria-label="Alerts per hour by severity chart. Use the left and right arrow keys to move between hours. The same data is available as a table."
        barCategoryGap="22%"
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
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ fill: 'var(--color-surface-sunken)' }}
          content={(props) => (
            <ChartTooltip
              active={props.active}
              payload={props.payload ? [...props.payload].reverse() : props.payload}
              severityKeys={SEVERITIES_BY_RANK}
              unit="alerts"
            />
          )}
        />
        {SEVERITIES_BY_RANK.map((s) => (
          <Bar
            key={s}
            dataKey={s}
            stackId="alerts"
            fill={SEVERITY_CHART_STYLE[s].fill}
            // The ink outline both separates stacked segments and keeps the pale gold legible.
            stroke={SEVERITY_CHART_STYLE[s].stroke}
            strokeWidth={1}
            maxBarSize={20}
            isAnimationActive={!reducedMotion}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

export function AlertsBySeverityChart() {
  const query = useAlertsSeries()
  const [showTable, setShowTable] = useState(false)
  const contentId = useId()
  return (
    <DataCard
      title="Alerts per hour"
      description="New alerts, stacked by severity"
      query={query}
      isEmpty={(d) => d.points.length === 0}
      empty={{
        title: 'No alerts in this window',
        message: 'The detection rules raised nothing in these 24 hours.',
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
        const rows = toAlertRows(series)
        const totals = {
          critical: rows.reduce((n, r) => n + r.critical, 0),
          high: rows.reduce((n, r) => n + r.high, 0),
          medium: rows.reduce((n, r) => n + r.medium, 0),
          low: rows.reduce((n, r) => n + r.low, 0),
        }
        return (
          <figure id={contentId} className="m-0">
            {showTable ? (
              <Table
                caption="Alerts by severity, hour by hour"
                regionClassName="max-h-72 overflow-y-auto"
              >
                <THead>
                  <Tr>
                    <Th>Hour (UTC)</Th>
                    {SEVERITIES_BY_RANK.map((s) => (
                      <Th key={s} numeric>
                        <SeverityBadge severity={s} />
                      </Th>
                    ))}
                    <Th numeric>Total</Th>
                  </Tr>
                </THead>
                <tbody>
                  {rows.map((r) => (
                    <Tr key={r.ts}>
                      <Td mono>{r.range}</Td>
                      {SEVERITIES_BY_RANK.map((s) => (
                        <Td key={s} numeric>
                          {formatNumber(r[s])}
                        </Td>
                      ))}
                      <Td numeric>{formatNumber(r.total)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <AlertsChart rows={rows} />
            )}
            <SeverityLegend totals={totals} />
            <figcaption className="mt-2 text-sm text-text-muted">{describeAlerts(rows)}</figcaption>
          </figure>
        )
      }}
    </DataCard>
  )
}
