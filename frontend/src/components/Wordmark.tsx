interface WordmarkProps {
  className?: string
}

/** SOC-Lite mark (a sighting reticle) and name. The name is real text, the mark is decorative. */
export function Wordmark({ className = '' }: WordmarkProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 32 32" className="size-7 shrink-0" aria-hidden="true" focusable="false">
        <circle cx="16" cy="16" r="9" fill="none" className="stroke-accent" strokeWidth="2.5" />
        <path
          d="M16 7v4M16 21v4M7 16h4M21 16h4"
          className="stroke-accent"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="16" cy="16" r="3.2" className="fill-coral" />
      </svg>
      <span className="type-display text-xl text-text">SOC-Lite</span>
    </span>
  )
}
