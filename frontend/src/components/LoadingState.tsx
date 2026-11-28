/** Suspense fallback for lazy-loaded pages: announced politely, skeleton hidden from AT. */
export function LoadingState() {
  return (
    <div role="status" aria-live="polite" className="max-w-xl">
      <span className="sr-only">Loading page…</span>
      <div aria-hidden="true" className="animate-pulse space-y-3">
        <div className="h-7 w-48 rounded-md bg-surface-sunken" />
        <div className="h-4 w-80 max-w-full rounded-sm bg-surface-sunken" />
        <div className="h-24 rounded-lg bg-surface-sunken" />
      </div>
    </div>
  )
}
