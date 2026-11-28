import { cx } from '../../lib/cx'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'sm' | 'md'

const base =
  'inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors duration-(--duration-fast) ease-standard disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-sunken disabled:text-text-disabled'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-fg hover:bg-accent-hover active:bg-accent-active',
  secondary:
    'border border-border-control bg-surface text-text hover:bg-surface-raised active:bg-surface-sunken',
  ghost: 'text-accent-ink hover:bg-accent-soft active:bg-accent-soft-hover',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-10 px-4 text-base',
}

/** Shared by Button and LinkButton so both look identical. */
export const buttonClasses = (variant: ButtonVariant, size: ButtonSize, extra?: string): string =>
  cx(base, variants[variant], sizes[size], extra)
