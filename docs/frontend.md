# Frontend & SOC Dashboard Design

> Status: **Approved design (Day 1)**. Implementation planned for Days 3, 8, 14, 19–28.

## Goals

A professional, dark-themed SOC console that an analyst could leave on a wall display
or work in all day: dense but readable, with severity always obvious at a glance.

## Stack

React + TypeScript (Vite), Tailwind CSS, Recharts, React Router, TanStack Query, Zod.

## Design system

Colors are defined once as Tailwind theme tokens (CSS variables) in `src/theme/`, never
hard-coded in components.

| Token | Purpose | Direction |
|---|---|---|
| `bg` / `surface` / `surface-raised` | page, cards, popovers | near-black slate, stepped lightness |
| `border` | separators | low-contrast slate |
| `text` / `text-muted` | content | high-contrast off-white / muted slate |
| `accent` | interactive elements, focus rings | cyan |
| `sev-critical` | critical | red |
| `sev-high` | high | orange |
| `sev-medium` | medium | amber |
| `sev-low` | low | blue |
| `sev-info` | informational | slate |
| `ok` | success / resolved | green |

Accessibility rules:

- Severity is never shown by color alone: badges include a label and an icon/shape.
- Text meets WCAG AA contrast on dark surfaces.
- All interactive elements are keyboard reachable with visible focus rings.
- Charts get readable tooltips and a table/legend fallback.
- `prefers-reduced-motion` disables non-essential animation (e.g., live feed transitions).

## Layout

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
  into a drawer on mobile.
- **Live updates:** WebSocket-driven feed with a pause toggle and a "new items" indicator,
  so content doesn't jump while the analyst is reading.
- **Interactivity:** clicking a chart segment (severity, IP, technique) navigates to a
  pre-filtered list; time range is shared across the dashboard via URL query params.

## Pages

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

Vitest + Testing Library for components and hooks; MSW to mock the API; tests for
severity badge accessibility, auth flow, and realtime hook reconnection.
