/** First tab stop on every page: jumps past the navigation to the main content. */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only rounded-md bg-surface-raised px-4 py-2.5 text-base font-medium text-accent-ink shadow-lg focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
    >
      Skip to main content
    </a>
  )
}
