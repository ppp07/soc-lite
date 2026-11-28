import { FlaskConical } from 'lucide-react'

import { formatUtcLongDateTime } from '../../../lib/format'
import { useDashboardSource } from '../dataSource'
import { useDashboardSummary } from '../queries'

/** Page-level statement that the figures below are simulated. Hidden only for a live source. */
export function SampleDataBanner() {
  const source = useDashboardSource()
  const { data } = useDashboardSummary()
  if (source.kind === 'live') return null
  return (
    <div
      role="note"
      className="mb-section flex items-start gap-3 rounded-lg border border-border-strong bg-surface-sunken p-4"
    >
      <FlaskConical className="mt-0.5 size-5 shrink-0 text-text-muted" aria-hidden="true" />
      <p className="text-text-muted">
        <strong className="font-semibold text-text">Sample data.</strong> Everything below is
        simulated
        {data ? ` for the 24 hours to ${formatUtcLongDateTime(data.window.to)} UTC` : ''}. It is not
        live, and it does not come from the SOC-Lite backend.
      </p>
    </div>
  )
}
