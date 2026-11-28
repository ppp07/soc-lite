import type { ComponentProps } from 'react'

import { cx } from '../../lib/cx'

export type BadgeTone = 'neutral' | 'accent' | 'coral' | 'ok'

const tones: Record<BadgeTone, string> = {
  neutral: 'border-border bg-surface-sunken text-text-muted',
  accent: 'border-transparent bg-accent-soft text-accent-ink',
  coral: 'border-transparent bg-coral-soft text-coral-ink',
  ok: 'border-transparent bg-status-ok-soft text-status-ok-ink',
}

interface BadgeProps extends ComponentProps<'span'> {
  tone?: BadgeTone
}

export function Badge({ tone = 'neutral', className, ...rest }: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        tones[tone],
        className,
      )}
      {...rest}
    />
  )
}
