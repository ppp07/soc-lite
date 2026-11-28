import { BarChart3, Table2 } from 'lucide-react'

import { Button } from '../../../components/ui/Button'

interface ChartTableToggleProps {
  showTable: boolean
  onToggle: () => void
  controlsId: string
}

/** Every chart has a table with the same data: the accessible alternative, and handy for copying. */
export function ChartTableToggle({ showTable, onToggle, controlsId }: ChartTableToggleProps) {
  const Icon = showTable ? BarChart3 : Table2
  return (
    <Button
      variant="ghost"
      size="sm"
      aria-pressed={showTable}
      aria-controls={controlsId}
      onClick={onToggle}
      leadingIcon={<Icon className="size-4" aria-hidden="true" />}
    >
      {showTable ? 'View as chart' : 'View as table'}
    </Button>
  )
}
