import { Circle, Clock, Menu, Search, UserRound } from 'lucide-react'
import type { Ref } from 'react'

import { Wordmark } from '../components/Wordmark'

interface TopbarProps {
  showMenuButton: boolean
  menuOpen: boolean
  menuControlsId: string
  onOpenMenu: () => void
  menuButtonRef: Ref<HTMLButtonElement>
}

const iconButton =
  'grid size-10 place-items-center rounded-md text-text-muted hover:bg-surface hover:text-text'
// Placeholders reserve the final layout. Truly disabled: not focusable, not clickable.
const disabledControl =
  'inline-flex min-h-10 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-text-disabled'

export function Topbar({
  showMenuButton,
  menuOpen,
  menuControlsId,
  onOpenMenu,
  menuButtonRef,
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-bg px-gutter">
      {showMenuButton ? (
        <>
          <button
            ref={menuButtonRef}
            type="button"
            onClick={onOpenMenu}
            aria-label="Open navigation"
            aria-expanded={menuOpen}
            aria-controls={menuControlsId}
            aria-haspopup="dialog"
            className={`${iconButton} -ml-2`}
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
          <Wordmark />
        </>
      ) : null}

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          disabled
          aria-label="Time range: last 24 hours (not available yet)"
          className={`${disabledControl} max-sm:hidden`}
        >
          <Clock className="size-4" aria-hidden="true" />
          Last 24 hours
        </button>
        <div className={`${disabledControl} max-md:hidden`}>
          <Search className="size-4" aria-hidden="true" />
          <input
            type="search"
            disabled
            aria-label="Search (not available yet)"
            name="search"
            autoComplete="off"
            spellCheck={false}
            placeholder="Search…"
            className="w-32 bg-transparent placeholder:text-text-disabled"
          />
        </div>
        <span className="inline-flex min-h-10 items-center gap-2 px-2 text-sm text-text-muted">
          {/* Ring shape + label: status is never colour alone. */}
          <Circle className="size-3 text-sev-info" aria-hidden="true" />
          Sample data
        </span>
        <button
          type="button"
          disabled
          aria-label="Account (not available yet)"
          className={iconButton}
        >
          <UserRound className="size-5 text-text-disabled" aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}
