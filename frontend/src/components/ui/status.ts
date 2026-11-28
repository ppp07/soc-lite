import {
  Archive,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  CircleDot,
  CircleSlash,
  Eye,
  Search,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'

import type { BadgeTone } from './Badge'

export type AlertStatus = 'new' | 'acknowledged' | 'in_progress' | 'resolved' | 'false_positive'
export type IncidentStatus = 'open' | 'investigating' | 'contained' | 'resolved' | 'closed'
export type Status = AlertStatus | IncidentStatus

export const STATUS_META: Record<Status, { label: string; icon: LucideIcon; tone: BadgeTone }> = {
  new: { label: 'New', icon: CircleDot, tone: 'coral' },
  acknowledged: { label: 'Acknowledged', icon: Eye, tone: 'accent' },
  in_progress: { label: 'In progress', icon: CircleDashed, tone: 'accent' },
  resolved: { label: 'Resolved', icon: CircleCheck, tone: 'ok' },
  false_positive: { label: 'False positive', icon: CircleSlash, tone: 'neutral' },
  open: { label: 'Open', icon: CircleAlert, tone: 'coral' },
  investigating: { label: 'Investigating', icon: Search, tone: 'accent' },
  contained: { label: 'Contained', icon: ShieldCheck, tone: 'accent' },
  closed: { label: 'Closed', icon: Archive, tone: 'neutral' },
}

export const STATUS_LABEL: Readonly<Record<Status, string>> = Object.fromEntries(
  Object.entries(STATUS_META).map(([k, v]) => [k, v.label]),
) as Record<Status, string>
