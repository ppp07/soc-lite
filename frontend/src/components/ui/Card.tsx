import type { ComponentProps, ElementType, ReactNode } from 'react'

import { cx } from '../../lib/cx'

type CardProps<T extends ElementType> = { as?: T } & Omit<ComponentProps<T>, 'as'>

/** Cream surface with a hairline border and a soft warm shadow. */
export function Card<T extends ElementType = 'section'>({ as, className, ...rest }: CardProps<T>) {
  const Tag: ElementType = as ?? 'section'
  return (
    <Tag
      className={cx('rounded-lg border border-border bg-surface shadow-sm', className)}
      {...rest}
    />
  )
}

interface CardHeaderProps {
  title: ReactNode
  /** Heading level. Pages use h1 for the page title, so cards default to h2. */
  titleAs?: 'h2' | 'h3'
  titleId?: string
  description?: ReactNode
  /** Right-aligned controls, e.g. a table-view toggle or a link. */
  actions?: ReactNode
}

export function CardHeader({
  title,
  titleAs: Heading = 'h2',
  titleId,
  description,
  actions,
}: CardHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-card pt-card">
      <div className="min-w-0">
        <Heading id={titleId} className="text-lg text-text">
          {title}
        </Heading>
        {description ? <p className="mt-0.5 text-sm text-text-subtle">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export function CardBody({ className, ...rest }: ComponentProps<'div'>) {
  return <div className={cx('p-card', className)} {...rest} />
}

export function CardFooter({ className, ...rest }: ComponentProps<'div'>) {
  return (
    <div
      className={cx(
        'flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border px-card py-3 text-xs text-text-subtle',
        className,
      )}
      {...rest}
    />
  )
}
