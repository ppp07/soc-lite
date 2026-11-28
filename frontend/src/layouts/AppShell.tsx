import { Suspense, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router'

import { LoadingState } from '../components/LoadingState'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { MobileDrawer } from './MobileDrawer'
import { Sidebar } from './Sidebar'
import { SidebarNav } from './SidebarNav'
import { SkipLink } from './SkipLink'
import { Topbar } from './Topbar'

/** Matches Tailwind's `lg` breakpoint (64rem). Below it, navigation lives in a drawer. */
export const DESKTOP_QUERY = '(min-width: 64rem)'
const DRAWER_ID = 'mobile-nav'

export default function AppShell() {
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const { pathname } = useLocation()
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  // The drawer is open only for the path it was opened on, so any navigation (links, history
  // back/forward) closes it without an effect.
  const [openedAt, setOpenedAt] = useState<string | null>(null)
  const menuOpen = !isDesktop && openedAt === pathname
  const closeMenu = () => {
    setOpenedAt(null)
  }

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <SkipLink />
      {isDesktop ? <Sidebar /> : null}
      <div className="flex min-w-0 flex-col">
        <Topbar
          showMenuButton={!isDesktop}
          menuOpen={menuOpen}
          menuControlsId={DRAWER_ID}
          menuButtonRef={menuButtonRef}
          onOpenMenu={() => {
            setOpenedAt(pathname)
          }}
        />
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-7xl flex-1 px-gutter py-section outline-none"
        >
          <Suspense fallback={<LoadingState />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      {isDesktop ? null : (
        <MobileDrawer id={DRAWER_ID} open={menuOpen} onClose={closeMenu}>
          <SidebarNav onNavigate={closeMenu} />
        </MobileDrawer>
      )}
    </div>
  )
}
