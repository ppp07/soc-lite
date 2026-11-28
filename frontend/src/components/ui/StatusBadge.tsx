import { Badge } from './Badge'
import { STATUS_META, type Status } from './status'

/** Workflow status: always an icon and a text label, with a restrained tone. Never colour alone. */
export function StatusBadge({ status }: { status: Status }) {
  const { label, icon: Icon, tone } = STATUS_META[status]
  return (
    <Badge tone={tone}>
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      {label}
    </Badge>
  )
}
