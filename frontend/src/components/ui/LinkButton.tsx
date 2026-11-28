import type { ComponentProps } from 'react'
import { Link } from 'react-router'

import { buttonClasses, type ButtonSize, type ButtonVariant } from './buttonStyles'

interface LinkButtonProps extends ComponentProps<typeof Link> {
  variant?: ButtonVariant
  size?: ButtonSize
}

/** A router link that looks like a Button. Use for navigation; use Button for actions. */
export function LinkButton({
  variant = 'primary',
  size = 'md',
  className,
  ...rest
}: LinkButtonProps) {
  return <Link className={buttonClasses(variant, size, className)} {...rest} />
}
