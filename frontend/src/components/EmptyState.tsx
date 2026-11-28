import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  children: ReactNode
  /** Secondary, quieter paragraph (e.g. a caveat). */
  note?: ReactNode
}

export function EmptyState({ icon: Icon, title, children, note }: EmptyStateProps) {
  return (
    <section className="flex max-w-xl items-start gap-4 rounded-lg border border-border bg-surface p-card shadow-sm">
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-accent-soft text-accent-ink">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div>
        <h2 className="text-lg text-text">{title}</h2>
        <p className="mt-1 text-text-muted">{children}</p>
        {note ? <p className="mt-3 text-sm text-text-subtle">{note}</p> : null}
      </div>
    </section>
  )
}
