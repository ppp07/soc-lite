import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { renderApp } from './test/renderApp'
import { NAV_ITEMS, ROUTES, formatDocumentTitle } from './routes'

describe('routes', () => {
  it.each(NAV_ITEMS)('renders $title at $path', async ({ path, title }) => {
    renderApp(path)
    expect(await screen.findByRole('heading', { level: 1, name: title })).toBeInTheDocument()
    await waitFor(() => {
      expect(document.title).toBe(formatDocumentTitle(title))
    })
  })

  it('redirects / to the dashboard', async () => {
    const { router } = renderApp('/')
    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible()
    expect(router.state.location.pathname).toBe('/dashboard')
  })

  it('shows the not-found page inside the shell for unknown paths', async () => {
    renderApp('/definitely/not/here')
    expect(await screen.findByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible()
    expect(document.title).toBe(formatDocumentTitle('Page not found'))
    // The shell is still there: navigation and a way home.
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Back to the dashboard' })).toHaveAttribute(
      'href',
      '/dashboard',
    )
  })

  it('does not steal focus on the initial page load', async () => {
    renderApp('/alerts')
    await screen.findByRole('heading', { level: 1, name: 'Alerts' })
    expect(document.body).toHaveFocus()
  })

  it('moves focus to the new page heading after navigating', async () => {
    const user = userEvent.setup()
    renderApp('/dashboard')
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' })
    await user.click(screen.getByRole('link', { name: 'Incidents' }))
    const heading = await screen.findByRole('heading', { level: 1, name: 'Incidents' })
    await waitFor(() => {
      expect(heading).toHaveFocus()
    })
  })

  it('keeps browser history working (back and forward)', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/dashboard')
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' })
    await user.click(screen.getByRole('link', { name: 'Alerts' }))
    await screen.findByRole('heading', { level: 1, name: 'Alerts' })
    await user.click(screen.getByRole('link', { name: 'Events' }))
    await screen.findByRole('heading', { level: 1, name: 'Events' })

    await router.navigate(-1)
    expect(await screen.findByRole('heading', { level: 1, name: 'Alerts' })).toBeVisible()
    await router.navigate(1)
    expect(await screen.findByRole('heading', { level: 1, name: 'Events' })).toBeVisible()
  })

  it('every nav item has a unique path and a planned-day note', () => {
    const paths = NAV_ITEMS.map((i) => i.path)
    expect(new Set(paths).size).toBe(paths.length)
    expect(Object.keys(ROUTES)).toHaveLength(9)
    for (const item of NAV_ITEMS) expect(item.planned).toMatch(/Day/)
  })
})
