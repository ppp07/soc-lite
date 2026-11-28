import {
  Activity,
  BellRing,
  BrainCircuit,
  ClipboardList,
  LayoutDashboard,
  ShieldAlert,
  SlidersHorizontal,
  UsersRound,
  Workflow,
  type LucideIcon,
} from 'lucide-react'

export const APP_NAME = 'SOC-Lite'

export const NAV_GROUPS = ['Monitor', 'Respond', 'Govern'] as const
export type NavGroup = (typeof NAV_GROUPS)[number]

export interface RouteMeta {
  readonly path: string
  /** Page title: nav label, <h1> and document title. */
  readonly title: string
  readonly summary: string
  /** When the real page lands, from docs/roadmap.md. */
  readonly planned: string
  readonly icon: LucideIcon
  readonly group: NavGroup
  /** Marks an administrative area. Informational only: no authorization exists yet. */
  readonly adminArea?: true
}

/** Single source of truth for navigation, placeholder pages and the router. */
export const ROUTES = {
  dashboard: {
    path: '/dashboard',
    title: 'Dashboard',
    summary: 'Security posture at a glance.',
    planned: 'Live dashboard analytics are planned for Days 23–24.',
    icon: LayoutDashboard,
    group: 'Monitor',
  },
  alerts: {
    path: '/alerts',
    title: 'Alerts',
    summary: 'Triage, assign and resolve detections.',
    planned: 'Alert management is planned for Days 19–20.',
    icon: BellRing,
    group: 'Monitor',
  },
  incidents: {
    path: '/incidents',
    title: 'Incidents',
    summary: 'Grouped alerts with a timeline and response history.',
    planned: 'Incident tracking is planned for Day 21.',
    icon: ShieldAlert,
    group: 'Monitor',
  },
  events: {
    path: '/events',
    title: 'Events',
    summary: 'Search normalized security events.',
    planned: 'Event search is planned for Day 14.',
    icon: Activity,
    group: 'Monitor',
  },
  rules: {
    path: '/rules',
    title: 'Rules',
    summary: 'Detection rules and their MITRE ATT&CK mapping.',
    planned: 'Detection rules arrive with the detection engine (Days 15–18).',
    icon: SlidersHorizontal,
    group: 'Respond',
  },
  response: {
    path: '/response',
    title: 'Response',
    summary: 'Simulated playbooks, approvals and action history.',
    planned: 'Simulated response is planned for Days 25–26.',
    icon: Workflow,
    group: 'Respond',
  },
  ml: {
    path: '/ml',
    title: 'ML',
    summary: 'Anomaly-detection models and their metrics.',
    planned: 'ML anomaly detection is planned for Days 27–28.',
    icon: BrainCircuit,
    group: 'Respond',
  },
  audit: {
    path: '/audit',
    title: 'Audit',
    summary: 'Append-only record of security-relevant actions.',
    planned: 'The audit log view is planned for Day 29.',
    icon: ClipboardList,
    group: 'Govern',
    adminArea: true,
  },
  admin: {
    path: '/admin',
    title: 'Administration',
    summary: 'Users, roles and API keys.',
    planned: 'Administration follows authentication and user management (Days 6–8).',
    icon: UsersRound,
    group: 'Govern',
    adminArea: true,
  },
} as const satisfies Record<string, RouteMeta>

export type RouteKey = keyof typeof ROUTES

export const NAV_ITEMS: readonly (RouteMeta & { readonly key: RouteKey })[] = (
  Object.keys(ROUTES) as RouteKey[]
).map((key) => ({ key, ...ROUTES[key] }))

export const DEFAULT_PATH = ROUTES.dashboard.path

export function formatDocumentTitle(title: string): string {
  return `${title} · ${APP_NAME}`
}
