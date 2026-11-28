import { useEffect } from 'react'

import { formatDocumentTitle } from '../routes'

/** Sets "<title> · SOC-Lite" so screen readers announce each route change. */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = formatDocumentTitle(title)
  }, [title])
}
