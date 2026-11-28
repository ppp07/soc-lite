import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { describe, expect, it, vi } from 'vitest'

import { SEVERITIES, SEVERITY_META } from '../../theme/severity'
import { Badge } from './Badge'
import { Button } from './Button'
import { Card, CardBody, CardFooter, CardHeader } from './Card'
import { ErrorState } from './ErrorState'
import { LinkButton } from './LinkButton'
import { SampleDataBadge } from './SampleDataBadge'
import { SeverityBadge } from './SeverityBadge'
import { SeverityMark } from './SeverityMark'
import { Skeleton } from './Skeleton'
import { StatTile } from './StatTile'
import { StatusBadge } from './StatusBadge'
import { STATUS_LABEL, type Status } from './status'
import { Table, Td, Th, THead, Tr } from './Table'

describe('Button', () => {
  it('fires onClick and defaults to type="button"', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Save</Button>)
    const button = screen.getByRole('button', { name: 'Save' })
    expect(button).toHaveAttribute('type', 'button')
    await userEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('blocks activation and announces busy while loading, keeping the label', async () => {
    const onClick = vi.fn()
    render(
      <Button loading onClick={onClick}>
        Retrying…
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Retrying…' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('supports disabled and forwards refs', () => {
    const ref = { current: null as HTMLButtonElement | null }
    render(
      <Button disabled ref={ref}>
        Nope
      </Button>,
    )
    expect(screen.getByRole('button', { name: 'Nope' })).toBeDisabled()
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })
})

describe('LinkButton', () => {
  it('renders a real link to the destination', () => {
    const router = createMemoryRouter([
      { path: '/', element: <LinkButton to="/alerts">View alerts</LinkButton> },
    ])
    render(<RouterProvider router={router} />)
    expect(screen.getByRole('link', { name: 'View alerts' })).toHaveAttribute('href', '/alerts')
  })
})

describe('Card', () => {
  it('renders a labelled section with a heading, body and footer', () => {
    render(
      <Card aria-labelledby="t">
        <CardHeader title="Recent alerts" titleId="t" description="Last 24 hours" />
        <CardBody>Body</CardBody>
        <CardFooter>Footer</CardFooter>
      </Card>,
    )
    const region = screen.getByRole('region', { name: 'Recent alerts' })
    expect(within(region).getByRole('heading', { level: 2, name: 'Recent alerts' })).toBeVisible()
    expect(within(region).getByText('Last 24 hours')).toBeVisible()
  })

  it('can render a different element and heading level', () => {
    render(
      <Card as="article">
        <CardHeader title="Nested" titleAs="h3" />
      </Card>,
    )
    expect(screen.getByRole('article')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument()
  })
})

describe('Badge and SampleDataBadge', () => {
  it('renders children', () => {
    render(<Badge tone="accent">T1110</Badge>)
    expect(screen.getByText('T1110')).toBeVisible()
  })

  it('SampleDataBadge says "Sample data" in text', () => {
    render(<SampleDataBadge />)
    expect(screen.getByText('Sample data')).toBeVisible()
  })
})

describe('SeverityBadge / SeverityMark', () => {
  it.each(SEVERITIES)('%s: visible text label, decorative distinct shape', (severity) => {
    const { container } = render(<SeverityBadge severity={severity} />)
    expect(screen.getByText(SEVERITY_META[severity].label)).toBeVisible()
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('data-shape', SEVERITY_META[severity].shape)
  })

  it('uses a different shape for every level (never colour alone)', () => {
    const shapes = SEVERITIES.map((s) => {
      const { container, unmount } = render(<SeverityMark severity={s} />)
      const shape = container.querySelector('svg')?.getAttribute('data-shape')
      unmount()
      return shape
    })
    expect(new Set(shapes).size).toBe(SEVERITIES.length)
  })

  it('medium is a soft tint, dark ink label and an outlined diamond, never gold alone', () => {
    const { container } = render(<SeverityBadge severity="medium" />)
    const badge = screen.getByText('Medium')
    expect(badge.className).toContain('bg-sev-medium-soft')
    expect(badge.className).toContain('text-sev-medium-ink')
    expect(badge.className).not.toMatch(/(?:^|\s)(?:bg|text)-sev-medium(?:\s|$)/)
    const diamond = container.querySelector('polygon')
    expect(diamond?.getAttribute('class')).toContain('stroke-sev-medium-ink')
    expect(diamond?.getAttribute('stroke-width')).toBe('1.25')
    expect(container.querySelector('svg')).toHaveAttribute('data-shape', 'diamond')
  })
})

describe('StatusBadge', () => {
  it.each(Object.keys(STATUS_LABEL) as Status[])(
    '%s has a text label and a hidden icon',
    (status) => {
      const { container } = render(<StatusBadge status={status} />)
      expect(screen.getByText(STATUS_LABEL[status])).toBeVisible()
      expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    },
  )
})

describe('StatTile', () => {
  const renderTile = (props: Partial<Parameters<typeof StatTile>[0]> = {}) =>
    render(
      <dl>
        <StatTile label="Open alerts" value="42" {...props} />
      </dl>,
    )

  it('shows label and value as a term/description pair', () => {
    renderTile({ unit: '/min' })
    expect(screen.getByText('Open alerts').tagName).toBe('DT')
    expect(screen.getByText('42').closest('dd')).toBeInTheDocument()
    expect(screen.getByText('/min')).toBeVisible()
  })

  it.each([
    ['up', '12% vs previous 24 h', 'Up 12% vs previous 24 h'],
    ['down', '3 vs previous 24 h', 'Down 3 vs previous 24 h'],
    ['flat', 'vs previous 24 h', 'No change vs previous 24 h'],
  ] as const)('states %s in words, not only with an arrow', (direction, text, expected) => {
    renderTile({ delta: { direction, text } })
    expect(screen.getByText(expected)).toBeVisible()
  })

  it('shows an accessible loading state instead of the value', () => {
    renderTile({ loading: true })
    expect(screen.getByRole('status')).toHaveTextContent('Loading Open alerts…')
    expect(screen.queryByText('42')).not.toBeInTheDocument()
  })
})

describe('Skeleton', () => {
  it('is hidden from assistive technology', () => {
    const { container } = render(<Skeleton className="h-4 w-10" />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('ErrorState', () => {
  it('announces the problem and offers a retry', async () => {
    const onRetry = vi.fn()
    render(
      <ErrorState
        title="Could not load alerts"
        message="Check your connection and try again."
        requestId="req-123"
        onRetry={onRetry}
      />,
    )
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Could not load alerts')
    expect(alert).toHaveTextContent('req-123')
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('disables the retry and says so while retrying', () => {
    render(<ErrorState title="x" message="y" onRetry={() => undefined} retrying />)
    expect(screen.getByRole('button', { name: 'Retrying…' })).toBeDisabled()
  })

  it('omits retry and request ID when not provided', () => {
    render(<ErrorState title="x" message="y" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByText(/Request ID/)).not.toBeInTheDocument()
  })
})

describe('Table', () => {
  it('is a labelled, keyboard-focusable scroll region around a semantic table', async () => {
    render(
      <Table caption="Recent alerts">
        <THead>
          <Tr>
            <Th>Severity</Th>
            <Th numeric>Count</Th>
          </Tr>
        </THead>
        <tbody>
          <Tr>
            <Td>High</Td>
            <Td numeric mono>
              7
            </Td>
          </Tr>
        </tbody>
      </Table>,
    )
    const region = screen.getByRole('region', { name: 'Recent alerts' })
    expect(region).toHaveAttribute('tabindex', '0')
    await userEvent.tab()
    expect(region).toHaveFocus()
    const table = within(region).getByRole('table', { name: 'Recent alerts' })
    expect(within(table).getAllByRole('columnheader')).toHaveLength(2)
    expect(within(table).getAllByRole('columnheader')[0]).toHaveAttribute('scope', 'col')
    expect(within(table).getByRole('cell', { name: '7' })).toBeVisible()
  })
})
