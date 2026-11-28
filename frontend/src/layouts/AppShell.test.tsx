import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { describe, expect, it, vi } from 'vitest'

import RootErrorPage from '../pages/RootErrorPage'
import RouteErrorPage from '../pages/RouteErrorPage'
import { NAV_GROUPS, NAV_ITEMS } from '../routes'
import { DESKTOP, MOBILE, renderApp } from '../test/renderApp'
import { setViewportWidth } from '../test/shims'
import AppShell from './AppShell'

describe('AppShell: desktop', () => {
  it('exposes the expected landmarks', async () => {
    renderApp('/dashboard', DESKTOP)
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' })
    expect(screen.getAllByRole('banner')).toHaveLength(1)
    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(screen.getAllByRole('navigation', { name: 'Primary' })).toHaveLength(1)
    expect(screen.getByRole('complementary')).toBeInTheDocument()
  })

  it('makes the skip link the first tab stop and points it at <main>', async () => {
    const user = userEvent.setup()
    renderApp('/dashboard', DESKTOP)
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' })
    await user.tab()
    const skip = screen.getByRole('link', { name: 'Skip to main content' })
    expect(skip).toHaveFocus()
    expect(skip).toHaveAttribute('href', '#main')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main')
  })

  it('lists every section, grouped, with icons hidden from assistive tech', async () => {
    renderApp('/dashboard', DESKTOP)
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' })
    const nav = screen.getByRole('navigation', { name: 'Primary' })
    for (const group of NAV_GROUPS) {
      expect(within(nav).getByRole('list', { name: group })).toBeInTheDocument()
    }
    expect(within(nav).getAllByRole('link')).toHaveLength(NAV_ITEMS.length)
    expect(nav.querySelectorAll('svg:not([aria-hidden="true"])')).toHaveLength(0)
  })

  it('marks only the current page with aria-current', async () => {
    renderApp('/alerts', DESKTOP)
    await screen.findByRole('heading', { level: 1, name: 'Alerts' })
    const nav = screen.getByRole('navigation', { name: 'Primary' })
    const current = within(nav)
      .getAllByRole('link')
      .filter((a) => a.getAttribute('aria-current') === 'page')
    expect(current).toHaveLength(1)
    expect(current[0]).toHaveAccessibleName('Alerts')
  })

  it('updates the active link when navigating', async () => {
    const user = userEvent.setup()
    renderApp('/alerts', DESKTOP)
    await screen.findByRole('heading', { level: 1, name: 'Alerts' })
    await user.click(screen.getByRole('link', { name: 'Events' }))
    await screen.findByRole('heading', { level: 1, name: 'Events' })
    expect(screen.getByRole('link', { name: 'Events' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Alerts' })).not.toHaveAttribute('aria-current')
  })

  it('labels Audit and Administration as admin areas without claiming access control', async () => {
    renderApp('/audit', DESKTOP)
    await screen.findByRole('heading', { level: 1, name: 'Audit' })
    const nav = screen.getByRole('navigation', { name: 'Primary' })
    for (const name of [/^Audit/, /^Administration/]) {
      expect(within(nav).getByRole('link', { name })).toHaveTextContent('Admin')
    }
    expect(within(nav).getByRole('link', { name: /^Alerts/ })).not.toHaveTextContent('Admin')
    expect(screen.getByText(/Access control is not implemented yet/)).toBeVisible()
    expect(screen.queryByText(/admin only|restricted|forbidden/i)).not.toBeInTheDocument()
  })

  it('has no menu button or dialog on desktop', async () => {
    renderApp('/dashboard', DESKTOP)
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' })
    expect(screen.queryByRole('button', { name: 'Open navigation' })).not.toBeInTheDocument()
    expect(document.querySelector('dialog')).toBeNull()
  })

  it('renders placeholder controls as genuinely disabled, with accessible names', async () => {
    renderApp('/dashboard', DESKTOP)
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' })
    for (const name of [/Time range.*not available yet/, /Account.*not available yet/]) {
      expect(screen.getByRole('button', { name })).toBeDisabled()
    }
    expect(screen.getByRole('searchbox', { name: /Search.*not available yet/ })).toBeDisabled()
    expect(screen.getByText('Sample data')).toBeVisible()
  })
})

describe('AppShell: mobile drawer', () => {
  const open = async (path = '/dashboard') => {
    const user = userEvent.setup()
    renderApp(path, MOBILE)
    await screen.findByRole('heading', { level: 1, name: /.+/ })
    const toggle = screen.getByRole('button', { name: 'Open navigation' })
    return { user, toggle }
  }

  it('shows a menu button and no persistent sidebar below the lg breakpoint', async () => {
    const { toggle } = await open()
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveAttribute('aria-controls', 'mobile-nav')
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  })

  it('opens as a modal dialog, moves focus inside, and reflects aria-expanded', async () => {
    const { user, toggle } = await open()
    await user.click(toggle)
    const dialog = document.querySelector('dialog')
    expect(dialog).toHaveAttribute('open')
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const nav = await screen.findByRole('navigation', { name: 'Primary' })
    expect(dialog).toContainElement(nav)
    expect(screen.getByRole('button', { name: 'Close navigation' })).toHaveFocus()
  })

  it('closes on Escape and returns focus to the menu button', async () => {
    const { user, toggle } = await open()
    await user.click(toggle)
    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(document.querySelector('dialog')).not.toHaveAttribute('open')
    })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveFocus()
  })

  it('closes with the close button and returns focus to the menu button', async () => {
    const { user, toggle } = await open()
    await user.click(toggle)
    await user.click(screen.getByRole('button', { name: 'Close navigation' }))
    expect(document.querySelector('dialog')).not.toHaveAttribute('open')
    expect(toggle).toHaveFocus()
  })

  it('closes when the backdrop is clicked', async () => {
    const { user, toggle } = await open()
    await user.click(toggle)
    const dialog = document.querySelector('dialog')
    if (!dialog) throw new Error('dialog missing')
    await user.click(dialog) // a click whose target is the dialog itself is a backdrop click
    expect(dialog).not.toHaveAttribute('open')
  })

  it('does not close when clicking inside the panel', async () => {
    const { user, toggle } = await open()
    await user.click(toggle)
    await user.click(screen.getByText('Monitor'))
    expect(document.querySelector('dialog')).toHaveAttribute('open')
  })

  it('closes after choosing a destination and shows that page', async () => {
    const { user, toggle } = await open('/dashboard')
    await user.click(toggle)
    await user.click(screen.getByRole('link', { name: 'Incidents' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Incidents' })).toBeVisible()
    expect(document.querySelector('dialog')).not.toHaveAttribute('open')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes when the route changes by other means (browser back)', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/dashboard', MOBILE)
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' })
    await router.navigate('/alerts')
    await screen.findByRole('heading', { level: 1, name: 'Alerts' })
    await user.click(screen.getByRole('button', { name: 'Open navigation' }))
    expect(document.querySelector('dialog')).toHaveAttribute('open')
    await router.navigate(-1)
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' })
    expect(document.querySelector('dialog')).not.toHaveAttribute('open')
  })

  it('switches between drawer and sidebar when the viewport crosses the breakpoint', async () => {
    renderApp('/dashboard', DESKTOP)
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' })
    expect(screen.getByRole('complementary')).toBeInTheDocument()
    setViewportWidth(MOBILE)
    await waitFor(() => {
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'Open navigation' })).toBeInTheDocument()
  })
})

describe('error handling', () => {
  function Boom(): never {
    throw new Error('kaboom')
  }

  const renderWithBoom = () => {
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <AppShell />,
          errorElement: <RootErrorPage />,
          children: [
            {
              errorElement: <RouteErrorPage />,
              children: [{ path: 'boom', element: <Boom /> }],
            },
          ],
        },
      ],
      { initialEntries: ['/boom'] },
    )
    return render(<RouterProvider router={router} />)
  }

  it('contains a page crash inside the shell so navigation keeps working', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    renderWithBoom()
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Something went wrong' }),
    ).toBeVisible()
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Back to the dashboard' })).toBeVisible()
    spy.mockRestore()
  })

  it('shows a standalone error screen when the shell itself fails', () => {
    render(<RootErrorPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Something went wrong' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Reload' })).toBeVisible()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })
})
