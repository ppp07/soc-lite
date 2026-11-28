import { TriangleAlert } from 'lucide-react'

import { Wordmark } from '../components/Wordmark'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

/** Last-resort error screen for failures in the shell itself, so it cannot use the shell. */
export default function RootErrorPage() {
  useDocumentTitle('Something went wrong')
  return (
    <main className="mx-auto grid min-h-dvh max-w-xl content-center gap-4 p-gutter">
      <Wordmark />
      <h1 className="text-2xl text-text">Something went wrong</h1>
      <p className="flex items-start gap-3 text-text-muted">
        <TriangleAlert className="mt-0.5 size-5 shrink-0 text-coral" aria-hidden="true" />
        The application hit an unexpected error. Reload the page to try again.
      </p>
      <div>
        <button
          type="button"
          onClick={() => {
            window.location.reload()
          }}
          className="inline-flex min-h-10 items-center rounded-md bg-accent px-4 text-base font-medium text-accent-fg hover:bg-accent-hover"
        >
          Reload
        </button>
      </div>
    </main>
  )
}
