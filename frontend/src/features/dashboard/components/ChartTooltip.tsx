import { SeverityMark } from '../../../components/ui/SeverityMark'
import { formatNumber } from '../../../lib/format'
import type { Severity } from '../../../theme/severity'

interface TooltipEntry {
  dataKey?: unknown
  name?: string | number | undefined
  value?: string | number | readonly (string | number)[] | undefined
  payload?: { range?: string } | undefined
}

interface ChartTooltipProps {
  active?: boolean | undefined
  payload?: readonly TooltipEntry[] | undefined
  /** Series keys that are severities get their shape mark, never colour alone. */
  severityKeys?: readonly string[]
  /** What the number counts, e.g. "events". */
  unit: string
}

/** Warm, token-styled tooltip. Everything it shows is also in the table view. */
export function ChartTooltip({ active, payload, severityKeys = [], unit }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const range = payload[0]?.payload?.range
  return (
    <div className="rounded-md border border-border-strong bg-surface-raised px-3 py-2 text-sm shadow-md">
      {range ? <p className="mb-1 type-data text-xs text-text-subtle">{range}</p> : null}
      <ul className="space-y-0.5">
        {payload.map((entry) => {
          const key =
            typeof entry.dataKey === 'string' || typeof entry.dataKey === 'number'
              ? String(entry.dataKey)
              : String(entry.name ?? '')
          const value = typeof entry.value === 'number' ? entry.value : Number(entry.value)
          return (
            <li key={key} className="flex items-center gap-2 text-text">
              {severityKeys.includes(key) ? <SeverityMark severity={key as Severity} /> : null}
              <span className="text-text-muted capitalize">
                {severityKeys.includes(key) ? key : unit}
              </span>
              <span className="ml-auto pl-4 font-medium tabular-nums">{formatNumber(value)}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
