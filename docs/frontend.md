# Frontend & SOC Dashboard Design

> Status: **Day 3 implemented** (foundation: shell, routing, design system, API client,
> sample-data dashboard). Feature pages arrive on Days 8, 14, 19–28. See
> [Current state and limitations](#current-state-and-limitations).

## Goals

A professional SOC console an analyst can work in all day: dense but readable, with
severity always obvious at a glance.

## Stack

React 19, TypeScript (strict), Vite, Tailwind CSS 4, React Router, TanStack Query, Zod,
Recharts, lucide-react icons. Tests: Vitest, Testing Library, MSW (jsdom).

## Current state and limitations

| Area | State |
|---|---|
| Application shell, routing, design system, base UI components | Implemented |
| API client (`request()`, typed errors, Zod validation, React Query) | Implemented |
| `GET /api/v1/health` | **The only real backend integration**, shown as the dashboard's "System status" card |
| Dashboard analytics (KPIs, charts, top-N, recent alerts/incidents) | Implemented against **simulated data**, labelled "Sample data" in the UI |
| Dashboard API contracts (`/dashboard/*`, alerts, incidents schemas) | **Provisional**: written ahead of the backend, will change when the endpoints exist |
| Alerts, Incidents, Events, Rules, Response, ML, Audit, Administration | **Placeholders** with no functionality |
| Authentication and authorization | Not implemented; admin areas are labelled only |
| Realtime (WebSocket), MITRE heatmap, live feed, time-range selection | Not implemented (planned) |
| Topbar search and time-range controls | Disabled placeholders |
| Docker image / hosted production deployment | Not yet (Day 4) |

## Architecture

```
src/
  routes.ts      single route table: nav, placeholder pages and router all derive from it
  router.tsx     React Router (lazy pages, error boundaries, 404)
  layouts/       AppShell, sidebar, mobile drawer, topbar, skip link
  components/    PageHeader, EmptyState, LoadingState, ... and ui/ (Button, Card, Badge,
                 SeverityBadge, StatusBadge, StatTile, Table, Skeleton, ErrorState, SampleDataBadge)
  features/      one folder per area; only dashboard/ has real content
  api/           config, http (request), errors, problem, queryClient, queryKeys,
                 health + useHealth, dashboardSource (interface), schemas/ (Zod)
  sample/        seeded simulated dataset and DashboardDataSource implementation
  theme/         design tokens, fonts, base styles, severity metadata
  hooks/ lib/ pages/ test/
```

### Routing

`src/routes.ts` is the single source of truth for the nine routes (`/dashboard`, `/alerts`,
`/incidents`, `/events`, `/rules`, `/response`, `/ml`, `/audit`, `/admin`). `/` redirects to
`/dashboard`; unknown paths render a 404 inside the shell. Pages are code-split with
`React.lazy`. A route error boundary renders inside the shell so navigation survives a
crashing page; a separate root boundary covers the shell itself. The shell provides a skip
link, a sidebar (a drawer on small screens) and a topbar; page titles update
`document.title`.

### Design system

Light, editorial theme (warm ivory surfaces, teal accent). Tokens are defined once in
`src/theme/tokens.css` in two layers: raw reference scales (`--ref-*`, not exposed as
Tailwind utilities) and semantic tokens (`bg-surface`, `text-text-muted`, `bg-sev-high-soft`, …)
that components use. The default Tailwind palette is removed, so raw colours such as
`bg-red-500` cannot be used. Fonts are self-hosted via Fontsource (Fraunces for headings and
KPI numerals, Inter for UI text, JetBrains Mono for IPs, timestamps and IDs); there is no
external font CDN.

| Token group | Purpose |
|---|---|
| `bg` / `surface` / `surface-raised` / `surface-sunken` | page, cards, popovers, table headers |
| `border` / `border-strong` / `border-control` | separators, emphasis, input outlines (≥ 3:1) |
| `text` / `text-muted` / `text-subtle` | content hierarchy |
| `accent`, `focus` | interactive elements, focus rings (teal) |
| `coral` | editorial highlight only; never means severity |
| `sev-critical` / `high` / `medium` / `low` / `info` (+ `-soft`, `-ink`) | severity |
| `status-ok` / `warning` / `danger` / `info` | status |
| `chart-*` | chart grid and axes |

Accessibility rules, enforced where noted:

- Severity is never shown by colour alone: badges carry a label and a distinct shape.
- Text and UI contrast against WCAG AA is asserted in `tokens.contrast.test.ts`.
- All interactive elements are keyboard reachable with visible focus rings; `eslint-plugin-jsx-a11y` is on.
- Charts have tooltips and a legend/table fallback.
- `prefers-reduced-motion` is respected.
- `dangerouslySetInnerHTML` is forbidden by ESLint: log content is attacker-controlled and
  is always rendered as text.

### API client

All HTTP goes through `request(path, { schema })` in `src/api/http.ts`:

- The base URL comes from `VITE_API_BASE_URL` (default `/api/v1`), validated with Zod.
- Every response is parsed with a Zod schema; the TypeScript type is what the schema proves.
- Failures are always an `ApiError` with a stable `kind`: `network`, `timeout`, `aborted`,
  `http`, `problem` (RFC 7807 body, including the request ID) or `parse`.
- 10 s default timeout, caller cancellation via `AbortSignal`, response bodies never logged.
- No authentication yet: this is the single place a bearer token will be attached (Day 8).

### React Query

`QueryProvider` supplies one `QueryClient`: 30 s `staleTime`, 5 min `gcTime`, refetch on
focus and reconnect. Only transient failures are retried (network, timeout, HTTP 408, 429
and 5xx; max 2, exponential back-off with jitter); other 4xx responses and invalid data are
never retried; mutations never retry. Query keys are
built only in `src/api/queryKeys.ts`, and keys for data that can come from more than one
source include the source (`sample` or `live`), so cached sample data can never be served
as live data.

### Zod validation

Zod validates the API config and every API response. Schemas live in `src/api/schemas/`
(`common`, `dashboard`, `alerts`, `incidents`) and `health.ts`. Only the **health** schema
mirrors a real backend response; the others are provisional (see below).

### Sample data and the dashboard

The dashboard reads through a `DashboardDataSource` interface
(`src/api/dashboardSource.ts`). The only implementation is `src/sample`: a seeded,
deterministic simulated day of events, alerts and incidents. There is deliberately no live
implementation yet; it will be added behind the same interface when the backend endpoints
exist (Days 19–24), without changing the dashboard.

- Everything derived from it is labelled "Sample data" (a banner and per-card badges).
- Only `features/dashboard/dataSource.ts` may import `src/sample`; ESLint and
  `architecture.test.ts` enforce this and also forbid `src/api` from importing it.
- In development and test builds, `?sample=slow|empty|error|flaky` exercises loading, empty,
  error and retry states. Production bundles ignore it.
- The dashboard contains: KPI tiles, events-per-hour and alerts-per-hour charts, alerts by
  severity, top source IPs, top users, recent alerts, recent incidents, and the live
  "System status" card (the real `GET /api/v1/health` call).

## Planned layout and pages

The sections below describe the **target** design; most of it is not yet implemented.
Only the shell and the dashboard subset listed above exist.

### Target layout

```
┌───────────────────────────────────────────────────────────────────────┐
│ ▣ SOC-Lite   [time range ▾]   [search]          ● Live      user ▾    │
├─────────┬─────────────────────────────────────────────────────────────┤
│ Dash    │ [Events/min] [Open alerts] [Critical] [Incidents] [MTTR]    │
│ Alerts  │ ┌─ Events & alerts over time ─────────┐ ┌─ By severity ───┐ │
│ Incid.  │ │ (area chart)                        │ │ (donut)         │ │
│ Events  │ └─────────────────────────────────────┘ └─────────────────┘ │
│ Rules   │ ┌─ MITRE ATT&CK heatmap ──────────────┐ ┌─ Live feed ─────┐ │
│ Resp.   │ │ tactics × techniques                │ │ ● CRIT brute…   │ │
│ ML      │ └─────────────────────────────────────┘ │ ● HIGH spray…   │ │
│ Audit   │ ┌─ Top source IPs ┐ ┌─ Top users ─────┐ │ ● MED  login…   │ │
│ Admin   │ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────┴─────────────────────────────────────────────────────────────┘
```

- **Responsive:** 12-column grid on desktop; cards stack on tablets; the sidebar collapses
  into a drawer on mobile (implemented for the shell and dashboard).
- **Live updates:** WebSocket-driven feed with a pause toggle and a "new items" indicator,
  so content doesn't jump while the analyst is reading.
- **Interactivity:** clicking a chart segment (severity, IP, technique) navigates to a
  pre-filtered list; time range is shared across the dashboard via URL query params.

### Target pages

| Page | Key elements |
|---|---|
| Dashboard | KPI tiles, time series, severity breakdown, MITRE heatmap, top-N, live feed |
| Alerts | filterable table, bulk actions, detail drawer with evidence, MITRE badges, timeline |
| Incidents | list + detail with timeline, linked alerts, response actions, MTTA/MTTR |
| Events | search with filters, raw/normalized toggle |
| Rules | enable/disable, thresholds, MITRE mapping (admin edit) |
| Response | playbooks, pending approvals, action history, simulated blocklist (clearly labelled *Simulated*) |
| ML | model versions, metrics, activate, train |
| Audit | admin-only searchable audit log |
| Admin | users, roles, API keys |

## Testing

Vitest + Testing Library for components and hooks; MSW to mock the API. Implemented:
route table and shell, UI components and severity accessibility, design-token contrast,
API client and error handling, query client retry policy and keys, health call, sample
dataset and metrics, dashboard states, and architecture rules. Planned: auth flow and
realtime hook reconnection.

Run the checks with the commands in the [developer guide](development.md#frontend-quick-start).
