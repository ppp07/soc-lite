import type { ReactNode } from 'react'
import { Link } from 'react-router'

interface ButtonLinkProps {
  to: string
  children: ReactNode
}

/** Minimal call-to-action link; folded into the shared Button in the base-components milestone. */
export function ButtonLink({ to, children }: ButtonLinkProps) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-10 items-center rounded-md bg-accent px-4 text-base font-medium text-accent-fg transition-colors duration-(--duration-fast) hover:bg-accent-hover active:bg-accent-active"
    >
      {children}
    </Link>
  )
}
