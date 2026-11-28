import { useMediaQuery } from './useMediaQuery'

/** True when the user asked the OS to minimise motion; used to turn chart animation off. */
export const usePrefersReducedMotion = (): boolean =>
  useMediaQuery('(prefers-reduced-motion: reduce)')
