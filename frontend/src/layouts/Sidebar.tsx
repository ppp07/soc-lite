import { Link } from 'react-router'

import { Wordmark } from '../components/Wordmark'
import { DEFAULT_PATH } from '../routes'
import { SidebarNav } from './SidebarNav'

/** Persistent navigation for wide screens. Narrow screens use MobileDrawer instead. */
export function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-dvh flex-col gap-6 overflow-y-auto border-r border-border bg-surface-sunken px-3 py-5">
      <Link to={DEFAULT_PATH} className="rounded-md px-3" aria-label="SOC-Lite, go to dashboard">
        <Wordmark />
      </Link>
      <SidebarNav />
    </aside>
  )
}
