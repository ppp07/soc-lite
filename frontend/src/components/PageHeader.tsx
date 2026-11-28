import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'

import { useDocumentTitle } from '../hooks/useDocumentTitle'

interface PageHeaderProps {
  title: string
  description?: string
  eyebrow?: string
}

/**
 * Page heading. Also owns two route-level accessibility behaviours:
 *  - the document title follows the heading;
 *  - after a client-side navigation, focus moves to the <h1> so keyboard and screen-reader
 *    users start at the new page. The first load is left alone (location key "default").
 */
export function PageHeader({ title, description, eyebrow }: PageHeaderProps) {
  useDocumentTitle(title)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const { key } = useLocation()

  useEffect(() => {
    if (key !== 'default') headingRef.current?.focus()
  }, [key])

  return (
    <div className="mb-section">
      {eyebrow ? <p className="mb-1.5 type-overline text-text-subtle">{eyebrow}</p> : null}
      <h1 ref={headingRef} tabIndex={-1} className="text-2xl text-text outline-none">
        {title}
      </h1>
      {description ? <p className="mt-1.5 max-w-prose text-text-muted">{description}</p> : null}
    </div>
  )
}
