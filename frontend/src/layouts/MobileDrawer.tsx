import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'

import { Wordmark } from '../components/Wordmark'

interface MobileDrawerProps {
  id: string
  open: boolean
  onClose: () => void
  children: ReactNode
}

/**
 * Navigation drawer built on the native <dialog> element opened with showModal(), which gives
 * us, from the browser: a focus trap, an inert page behind it, Escape to close and focus
 * restoration to the opener. We only sync React state with the dialog's lifecycle.
 */
export function MobileDrawer({ id, open, onClose, children }: MobileDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  // A click on the backdrop targets the <dialog> itself (the panel inside fills it), so a click
  // whose target is the dialog means "outside". Bound imperatively: it is a pointer convenience
  // on top of the keyboard-accessible close button and Escape, not a separate interaction.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const onClick = (event: MouseEvent) => {
      if (event.target === dialog) onClose()
    }
    dialog.addEventListener('click', onClick)
    return () => {
      dialog.removeEventListener('click', onClick)
    }
  }, [onClose])

  return (
    <dialog
      ref={dialogRef}
      id={id}
      aria-label="Navigation"
      // Fires for Escape and for close(); keeps React state in step with the dialog.
      onClose={onClose}
      className="m-0 h-dvh max-h-none w-72 max-w-[85vw] translate-x-0 overflow-hidden border-r border-border bg-surface-sunken p-0 text-text transition-transform duration-(--duration-base) ease-standard backdrop:bg-overlay starting:open:-translate-x-full"
    >
      <div className="flex h-full flex-col gap-6 overflow-y-auto overscroll-contain px-3 py-5">
        <div className="flex items-center justify-between px-3">
          <Wordmark />
          {/* First focusable element: receives focus when the drawer opens. */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="grid size-10 place-items-center rounded-md text-text-muted hover:bg-surface hover:text-text"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}
