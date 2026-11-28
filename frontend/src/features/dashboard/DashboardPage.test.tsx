import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import { formatMinutes, formatNumber, formatPercent, formatUtcDateTime } from '../../lib/format'
import { buildSampleDataset, createSampleDashboardSource } from '../../sample'
import { server } from '../../test/server'
import { renderApp } from '../../test/renderApp'
import { asLive, failing, gated, instantSource } from '../../test/sources'

const ds = buildSampleDataset()
const card = (name: string) => screen.getByRole('region', { name })
const SAMPLE_CARDS = [
  'Events per hour',
  'Alerts per hour',
  'Alerts by severity',
  'Recent alerts',
  'Top source IPs',
  'Top users',
  'Incident activity',
]

async function renderDashboard(options: Parameters<typeof renderApp>[1] = {}) {
  const utils = renderApp('/dashboard', { dashboardSource: instantSource(), ...options })
  await screen.findByRole('heading', { level: 1, name: 'Dashboard' })
  return utils
}

describe('Dashboard: loaded', () => {
  it('has one h1 and an h2 for every card', async () => {
    await renderDashboard()
    await screen.findByText('Backend online')
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    const h2 = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(h2).toEqual(expect.arrayContaining([...SAMPLE_CARDS, 'System status']))
  })

  it('shows the key figures from the sample summary, with deltas in words', async () => {
    await renderDashboard()
    const kpis = within(await screen.findByRole('region', { name: 'Key figures' }))
    const s = ds.summary
    await waitFor(() => {
      expect(kpis.getByText('Open alerts').closest('div')).toHaveTextContent(
        formatNumber(s.open_alerts.value),
      )
    })
    expect(kpis.getByText('Events per minute').closest('div')).toHaveTextContent(
      formatNumber(s.events_per_minute.value),
    )
    expect(kpis.getByText('Critical alerts').closest('div')).toHaveTextContent(
      String(s.critical_alerts.value),
    )
    expect(kpis.getByText('Open incidents').closest('div')).toHaveTextContent(
      String(s.open_incidents.value),
    )
    expect(kpis.getByText('Time to resolve').closest('div')).toHaveTextContent(
      formatMinutes(s.mttr_minutes.value),
    )
    expect(kpis.getAllByText(/^(Up|Down|No change) /).length).toBe(5)
  })

  it('lists the most recent alerts newest first, with UTC times and ATT&CK ids', async () => {
    await renderDashboard()
    const table = await within(card('Recent alerts')).findByRole('table')
    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(8)
    const first = ds.alerts[0]
    expect(first).toBeDefined()
    expect(rows[0]).toHaveTextContent(first?.title ?? '')
    expect(
      within(rows[0] as HTMLElement).getByText(formatUtcDateTime(first?.last_seen ?? '')),
    ).toHaveAttribute('datetime', first?.last_seen)
    expect(within(table).getAllByText('T1048').length).toBeGreaterThan(0)
    expect(within(table).getAllByText('Critical').length).toBeGreaterThan(0)
  })

  it('shows severity with a label and shape, and medium as tint + ink + outlined diamond', async () => {
    await renderDashboard()
    const table = await within(card('Recent alerts')).findByRole('table')
    const medium = within(table).getAllByText('Medium')[0] as HTMLElement
    expect(medium.className).toContain('bg-sev-medium-soft')
    expect(medium.className).toContain('text-sev-medium-ink')
    expect(medium.querySelector('svg')).toHaveAttribute('data-shape', 'diamond')
    expect(medium.querySelector('polygon')?.getAttribute('class')).toContain(
      'stroke-sev-medium-ink',
    )
  })

  it('shows incident activity with status labels and unassigned owners', async () => {
    await renderDashboard()
    const table = await within(card('Incident activity')).findByRole('table')
    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(5)
    expect(rows[0]).toHaveTextContent('INC-0008')
    expect(within(table).getByText('Unassigned')).toBeVisible()
    expect(within(table).getByText('Investigating')).toBeVisible()
  })

  it('breaks alerts down by severity with exact counts and shares', async () => {
    await renderDashboard()
    const table = await within(card('Alerts by severity')).findByRole('table')
    const total = ds.alerts.length
    for (const level of ['critical', 'high', 'medium', 'low'] as const) {
      const label = level[0]?.toUpperCase() + level.slice(1)
      const row = within(table).getByText(label).closest('tr') as HTMLElement
      expect(row).toHaveTextContent(String(ds.summary.alerts_by_severity[level]))
      expect(row).toHaveTextContent(formatPercent(ds.summary.alerts_by_severity[level] / total))
    }
  })

  it('ranks top IPs and users', async () => {
    await renderDashboard()
    const ips = await within(card('Top source IPs')).findByRole('list', { name: /by events/ })
    expect(within(ips).getAllByRole('listitem')).toHaveLength(5)
    expect(within(ips).getAllByRole('listitem')[0]).toHaveTextContent('192.0.2.88')
    const users = await within(card('Top users')).findByRole('list', { name: /by alerts/ })
    expect(within(users).getAllByRole('listitem')).toHaveLength(5)
  })

  it('offers a table alternative for each chart', async () => {
    const user = userEvent.setup()
    await renderDashboard()
    const events = card('Events per hour')
    const toggle = await within(events).findByRole('button', { name: 'View as table' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(within(events).getByText(/^Peak .* events at/)).toBeVisible() // visible text summary
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(toggle).toHaveAccessibleName('View as chart')
    const table = within(events).getByRole('table', { name: 'Events, hour by hour' })
    expect(within(table).getAllByRole('row')).toHaveLength(25)

    const alerts = card('Alerts per hour')
    await user.click(await within(alerts).findByRole('button', { name: 'View as table' }))
    const alertTable = within(alerts).getByRole('table', {
      name: 'Alerts by severity, hour by hour',
    })
    expect(within(alertTable).getAllByRole('row')).toHaveLength(25)
    expect(
      within(alertTable)
        .getAllByRole('columnheader')
        .map((h) => h.textContent),
    ).toEqual(expect.arrayContaining(['Hour (UTC)', 'Critical', 'High', 'Medium', 'Low', 'Total']))
  })

  it('shows a severity legend with shapes and totals under the alerts chart', async () => {
    await renderDashboard()
    const legend = await within(card('Alerts per hour')).findByRole('list', {
      name: 'Severity legend',
    })
    expect(within(legend).getAllByRole('listitem')).toHaveLength(4)
    expect(legend.querySelectorAll('svg[data-shape]')).toHaveLength(4)
    expect(legend).toHaveTextContent(`Critical${ds.summary.alerts_by_severity.critical}`)
  })
})

describe('Dashboard: sample data is never presented as live', () => {
  it('says so in a page banner and on every simulated card', async () => {
    await renderDashboard()
    const note = await screen.findByRole('note')
    expect(note).toHaveTextContent('Sample data.')
    expect(note).toHaveTextContent(/not live/i)
    await waitFor(() => {
      expect(note).toHaveTextContent('28 Nov 2026, 09:00 UTC')
    })
    for (const name of SAMPLE_CARDS) {
      expect(within(card(name)).getByText('Sample data')).toBeVisible()
    }
  })

  it('labels the health card as a live check, not sample data', async () => {
    await renderDashboard()
    const status = card('System status')
    expect(await within(status).findByText('Backend online')).toBeVisible()
    expect(within(status).getByText('Live check')).toBeVisible()
    expect(within(status).queryByText('Sample data')).not.toBeInTheDocument()
  })

  it('drops every sample label when the source is genuinely live', async () => {
    await renderDashboard({ dashboardSource: asLive(instantSource()) })
    await within(card('Recent alerts')).findByRole('table')
    expect(screen.queryByRole('note')).not.toBeInTheDocument()
    for (const name of SAMPLE_CARDS) {
      expect(within(card(name)).queryByText('Sample data')).not.toBeInTheDocument()
    }
  })
})

describe('Dashboard: loading', () => {
  it('announces loading in every card and in the key figures, then shows data', async () => {
    const { source, release } = gated(instantSource())
    await renderDashboard({ dashboardSource: source })

    for (const name of SAMPLE_CARDS) {
      expect(within(card(name)).getByRole('status')).toHaveTextContent(`Loading ${name}…`)
      expect(card(name)).toHaveAttribute('aria-busy', 'true')
    }
    expect(
      within(screen.getByRole('region', { name: 'Key figures' })).getAllByRole('status'),
    ).toHaveLength(5)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()

    release()
    expect(await within(card('Recent alerts')).findByRole('table')).toBeVisible()
    expect(card('Recent alerts')).not.toHaveAttribute('aria-busy')
    expect(within(card('Recent alerts')).queryByRole('status')).not.toBeInTheDocument()
  })
})

describe('Dashboard: errors and retry', () => {
  it('shows a plain-language error with a retry in each failing card', async () => {
    const down = failing(instantSource(), [
      'summary',
      'eventsSeries',
      'alertsSeries',
      'top',
      'recentAlerts',
      'recentIncidents',
    ])
    await renderDashboard({ dashboardSource: down })
    for (const name of SAMPLE_CARDS) {
      const alert = await within(card(name)).findByRole('alert')
      expect(alert).toHaveTextContent('Can’t reach the server')
      expect(within(alert).getByRole('button', { name: 'Try again' })).toBeEnabled()
    }
    expect(await screen.findByText(/Key figures unavailable/)).toBeVisible()
  })

  it('isolates failures: one broken card leaves the others working', async () => {
    await renderDashboard({ dashboardSource: failing(instantSource(), ['recentAlerts']) })
    expect(await within(card('Recent alerts')).findByRole('alert')).toBeVisible()
    expect(await within(card('Incident activity')).findByRole('table')).toBeVisible()
    expect(await within(card('Top source IPs')).findByRole('list')).toBeVisible()
    expect(within(card('Incident activity')).queryByRole('alert')).not.toBeInTheDocument()
  })

  it('retries in place and recovers without reloading', async () => {
    const user = userEvent.setup()
    await renderDashboard({ dashboardSource: failing(instantSource(), ['recentAlerts'], 1) })
    const recent = card('Recent alerts')
    await user.click(await within(recent).findByRole('button', { name: 'Try again' }))
    expect(await within(recent).findByRole('table')).toBeVisible()
    expect(within(recent).queryByRole('alert')).not.toBeInTheDocument()
  })

  it('stays on the error state, still offering retry, while the outage continues', async () => {
    const user = userEvent.setup()
    await renderDashboard({ dashboardSource: failing(instantSource(), ['recentIncidents']) })
    const incidents = card('Incident activity')
    await user.click(await within(incidents).findByRole('button', { name: 'Try again' }))
    expect(await within(incidents).findByRole('alert')).toBeVisible()
    expect(within(incidents).getByRole('button', { name: 'Try again' })).toBeEnabled()
  })
})

describe('Dashboard: empty', () => {
  it('explains each empty card specifically instead of drawing empty charts', async () => {
    await renderDashboard({
      dashboardSource: createSampleDashboardSource({ scenario: 'empty', latencyMs: 0 }),
    })
    expect(
      await within(card('Events per hour')).findByText('No events in this window'),
    ).toBeVisible()
    expect(
      await within(card('Alerts per hour')).findByText('No alerts in this window'),
    ).toBeVisible()
    expect(
      await within(card('Alerts by severity')).findByText('No alerts in this window'),
    ).toBeVisible()
    expect(await within(card('Recent alerts')).findByText('No alerts in this window')).toBeVisible()
    expect(
      await within(card('Incident activity')).findByText('No incidents in this window'),
    ).toBeVisible()
    expect(await within(card('Top users')).findByText('Nothing to rank')).toBeVisible()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    // Key figures render real zeros rather than disappearing.
    const kpis = within(screen.getByRole('region', { name: 'Key figures' }))
    await waitFor(() => {
      expect(kpis.getByText('Open alerts').closest('div')).toHaveTextContent('0')
    })
  })
})

describe('Dashboard: backend status (the one live call)', () => {
  it('shows the service name, version and check time when the backend is up', async () => {
    await renderDashboard()
    const status = card('System status')
    expect(await within(status).findByText('Backend online')).toBeVisible()
    expect(within(status).getByText('SOC-Lite')).toBeVisible()
    expect(within(status).getByText('0.1.0')).toBeVisible()
    expect(within(status).getByText(/UTC$/)).toBeVisible()
  })

  it('reports an unreachable backend and recovers on retry', async () => {
    const user = userEvent.setup()
    server.use(http.get('*/api/v1/health', () => HttpResponse.error()))
    await renderDashboard()
    const status = card('System status')
    const alert = await within(status).findByRole('alert')
    expect(alert).toHaveTextContent('Can’t reach the server')
    expect(alert).toHaveTextContent(/backend is running/i)

    server.resetHandlers() // the backend comes back
    await user.click(within(alert).getByRole('button', { name: 'Try again' }))
    expect(await within(status).findByText('Backend online')).toBeVisible()
  })

  it('reports a server error without exposing server text', async () => {
    server.use(
      http.get('*/api/v1/health', () =>
        HttpResponse.json(
          {
            type: 't',
            title: 'Internal Server Error',
            status: 500,
            detail: 'Traceback: /srv/app/secret.py',
            request_id: 'req-9',
          },
          { status: 500 },
        ),
      ),
    )
    await renderDashboard()
    const alert = await within(card('System status')).findByRole('alert')
    expect(alert).toHaveTextContent('The server had a problem')
    expect(alert).toHaveTextContent('req-9')
    expect(alert).not.toHaveTextContent('Traceback')
  })

  it('does not break the simulated cards when the backend is down', async () => {
    server.use(http.get('*/api/v1/health', () => HttpResponse.error()))
    await renderDashboard()
    expect(await within(card('Recent alerts')).findByRole('table')).toBeVisible()
    expect(await within(card('System status')).findByRole('alert')).toBeVisible()
  })
})

describe('Dashboard: chart actions only appear when there is data', () => {
  it('hides "View as table" while loading, on error and when empty', async () => {
    const { source, release } = gated(instantSource())
    const first = await renderDashboard({ dashboardSource: source })
    expect(screen.queryByRole('button', { name: 'View as table' })).not.toBeInTheDocument()
    release()
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'View as table' })).toHaveLength(2)
    })
    first.unmount()

    await renderDashboard({
      dashboardSource: failing(instantSource(), ['eventsSeries', 'alertsSeries']),
    })
    await within(card('Events per hour')).findByRole('alert')
    expect(screen.queryByRole('button', { name: 'View as table' })).not.toBeInTheDocument()
  })

  it('keeps navigation links (not data actions) available while loading', async () => {
    const { source } = gated(instantSource())
    await renderDashboard({ dashboardSource: source })
    expect(
      within(card('Recent alerts')).getByRole('link', { name: 'View all alerts' }),
    ).toHaveAttribute('href', '/alerts')
  })
})
