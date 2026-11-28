import { Skeleton } from '../../../components/ui/Skeleton'
import { SeverityBadge } from '../../../components/ui/SeverityBadge'
import { Table, Td, Th, THead, Tr } from '../../../components/ui/Table'
import { formatNumber, formatPercent } from '../../../lib/format'
import { SEVERITY_CHART_STYLE } from '../../../theme/severity'
import { useDashboardSummary } from '../queries'
import { SEVERITIES_BY_RANK } from '../severityOrder'
import { DataCard } from './DataCard'

/**
 * Composition of the 24-hour alert load. A single proportional bar (never a donut: lengths are
 * easier to compare than angles) plus a table, which carries the exact numbers and the shapes.
 */
export function SeverityDistribution() {
  const query = useDashboardSummary()
  return (
    <DataCard
      title="Alerts by severity"
      description="All alerts raised in the last 24 hours"
      query={query}
      isEmpty={(d) => Object.values(d.alerts_by_severity).every((n) => n === 0)}
      empty={{
        title: 'No alerts in this window',
        message: 'The detection rules raised nothing in these 24 hours.',
      }}
      skeleton={
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      }
    >
      {(summary) => {
        const counts = summary.alerts_by_severity
        const total = SEVERITIES_BY_RANK.reduce((n, s) => n + counts[s], 0)
        return (
          <div>
            <p className="type-numeral text-3xl text-text">
              {formatNumber(total)} <span className="text-base text-text-muted">alerts</span>
            </p>
            {/* Decorative: the table below is the accessible version of this bar. */}
            <div aria-hidden="true" className="mt-3 flex h-3 gap-0.5 overflow-hidden rounded-sm">
              {SEVERITIES_BY_RANK.filter((s) => counts[s] > 0).map((s) => (
                <div
                  key={s}
                  className="h-full min-w-1 rounded-[2px] border"
                  style={{
                    flexGrow: counts[s],
                    flexBasis: 0,
                    background: SEVERITY_CHART_STYLE[s].fill,
                    borderColor: SEVERITY_CHART_STYLE[s].stroke,
                  }}
                />
              ))}
            </div>
            <div className="mt-4">
              <Table caption="Alert counts by severity" scrollable={false}>
                <THead>
                  <Tr>
                    <Th>Severity</Th>
                    <Th numeric>Alerts</Th>
                    <Th numeric>Share</Th>
                  </Tr>
                </THead>
                <tbody>
                  {SEVERITIES_BY_RANK.map((s) => (
                    <Tr key={s}>
                      <Td>
                        <SeverityBadge severity={s} />
                      </Td>
                      <Td numeric>{formatNumber(counts[s])}</Td>
                      <Td numeric className="text-text-muted">
                        {formatPercent(total === 0 ? 0 : counts[s] / total)}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        )
      }}
    </DataCard>
  )
}
