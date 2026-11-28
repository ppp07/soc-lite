import type { ComponentProps } from 'react'

import { cx } from '../../lib/cx'

interface TableProps extends ComponentProps<'table'> {
  /** Accessible name of the table; also names the scroll region. */
  caption: string
  /**
   * Wrap in a keyboard-focusable horizontal scroll region (default). Turn off for small tables
   * that never overflow, so they do not add a pointless tab stop.
   */
  scrollable?: boolean
  /** Extra classes for the scroll region, e.g. a max height. */
  regionClassName?: string
}

/**
 * A semantic table. By default it sits inside a keyboard-focusable scroll region, so narrow
 * screens can scroll horizontally without scrolling the page; the first column stays visible.
 */
export function Table({
  caption,
  scrollable = true,
  regionClassName,
  className,
  children,
  ...rest
}: TableProps) {
  const table = (
    <table
      className={cx(
        'w-full border-collapse text-left text-sm',
        scrollable &&
          '[&_tbody_tr>:first-child]:bg-surface [&_thead_tr>:first-child]:bg-surface-sunken [&_tr>:first-child]:sticky [&_tr>:first-child]:left-0',
        className,
      )}
      {...rest}
    >
      <caption className="sr-only">{caption}</caption>
      {children}
    </table>
  )
  if (!scrollable) return table
  return (
    <div
      role="region"
      aria-label={caption}
      // A scrollable region must be focusable so keyboard users can scroll it (WCAG 2.1.1).
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      className={cx('overflow-x-auto overscroll-x-contain rounded-md', regionClassName)}
    >
      {table}
    </div>
  )
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="sticky top-0 z-1 border-y border-border bg-surface-sunken">{children}</thead>
  )
}

export function Tr({ className, ...rest }: ComponentProps<'tr'>) {
  return <tr className={cx('border-b border-border last:border-b-0', className)} {...rest} />
}

interface CellProps {
  numeric?: boolean
}

export function Th({ numeric, className, ...rest }: ComponentProps<'th'> & CellProps) {
  return (
    <th
      scope="col"
      className={cx(
        'px-3 py-2.5 type-overline font-semibold whitespace-nowrap text-text-subtle',
        numeric ? 'text-right' : 'text-left',
        className,
      )}
      {...rest}
    />
  )
}

export function Td({
  numeric,
  mono,
  className,
  ...rest
}: ComponentProps<'td'> & CellProps & { mono?: boolean }) {
  return (
    <td
      className={cx(
        'px-3 py-3 align-top text-text',
        numeric && 'text-right tabular-nums',
        mono && 'type-data text-text-muted',
        className,
      )}
      {...rest}
    />
  )
}
