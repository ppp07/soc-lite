/**
 * jsdom lacks matchMedia and the modal <dialog> API. These shims are deliberately minimal and
 * mimic only the parts of native behaviour that SOC-Lite code relies on:
 *   showModal(): sets `open`, remembers the opener, focuses the first focusable element
 *   close():     clears `open`, fires `close`, restores focus to the opener
 *   Escape:      fires `cancel`, then closes
 * They do NOT emulate the real focus trap or the inert page behind a modal. Those are browser
 * behaviours, verified with Playwright (see the Day 3 milestone notes), not in jsdom.
 */

let viewportWidthPx = 1280
const listeners = new Set<() => void>()

function matches(query: string): boolean {
  const m = /\(min-width:\s*([\d.]+)(px|rem)\)/.exec(query)
  if (!m?.[1]) return false
  const width = parseFloat(m[1]) * (m[2] === 'rem' ? 16 : 1)
  return viewportWidthPx >= width
}

/** Change the simulated viewport width and notify matchMedia subscribers. */
export function setViewportWidth(px: number): void {
  viewportWidthPx = px
  listeners.forEach((l) => {
    l()
  })
}

export function installDomShims(): void {
  if (typeof window === 'undefined') return // node-environment test files

  window.matchMedia = (query: string): MediaQueryList => {
    const handlers = new Set<EventListenerOrEventListenerObject>()
    let last = matches(query)
    const notify = () => {
      const next = matches(query)
      if (next === last) return
      last = next
      handlers.forEach((h) => {
        if (typeof h === 'function') h(new Event('change'))
        else h.handleEvent(new Event('change'))
      })
    }
    return {
      get matches() {
        return matches(query)
      },
      media: query,
      onchange: null,
      addEventListener: (_t: string, h: EventListenerOrEventListenerObject) => {
        handlers.add(h)
        listeners.add(notify)
      },
      removeEventListener: (_t: string, h: EventListenerOrEventListenerObject) => {
        handlers.delete(h)
        listeners.delete(notify)
      },
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }
  }

  if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
    const openers = new WeakMap<HTMLDialogElement, Element | null>()
    HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
      openers.set(this, document.activeElement)
      this.setAttribute('open', '')
      this.querySelector<HTMLElement>('button, a[href], input, [tabindex]')?.focus()
      this.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return
        const cancel = new Event('cancel', { cancelable: true })
        this.dispatchEvent(cancel)
        if (!cancel.defaultPrevented) this.close()
      })
    }
    HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
      if (!this.hasAttribute('open')) return
      this.removeAttribute('open')
      this.dispatchEvent(new Event('close'))
      const opener = openers.get(this)
      if (opener instanceof HTMLElement) opener.focus()
    }
  }
}
