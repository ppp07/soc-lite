import { SeverityMark } from '../../../components/ui/SeverityMark'
import { formatNumber } from '../../../lib/format'
import { SEVERITY_META } from '../../../theme/severity'
import { SEVERITIES_BY_RANK, type DashboardSeverity } from '../severityOrder'

/** Legend with shape, name and total, so identity never depends on colour. */
export function SeverityLegend({
  totals,
}: {
  totals: Readonly<Record<DashboardSeverity, number>>
}) {
  return (
    <ul aria-label="Severity legend" className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
      {SEVERITIES_BY_RANK.map((s) => (
        <li key={s} className="flex items-center gap-1.5 text-text-muted">
          <SeverityMark severity={s} />
          <span>{SEVERITY_META[s].label}</span>
          <span className="font-medium text-text tabular-nums">{formatNumber(totals[s])}</span>
        </li>
      ))}
    </ul>
  )
}
