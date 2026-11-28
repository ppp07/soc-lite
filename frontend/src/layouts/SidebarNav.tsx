import { NavLink } from 'react-router'

import { NAV_GROUPS, NAV_ITEMS } from '../routes'

interface SidebarNavProps {
  /** Called when a link is activated (the mobile drawer uses it to close itself). */
  onNavigate?: () => void
}

const linkBase =
  'relative flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-base transition-colors duration-(--duration-fast) ease-standard'
const linkIdle = 'text-text-muted hover:bg-surface hover:text-text'
// Active state is shown by background, weight AND a leading bar, never colour alone.
const linkActive =
  'bg-accent-soft font-semibold text-accent-ink before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-accent'

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  return (
    <nav aria-label="Primary" className="flex flex-col gap-6">
      {NAV_GROUPS.map((group) => (
        <div key={group}>
          <p
            id={`nav-group-${group.toLowerCase()}`}
            className="mb-1.5 px-3 type-overline text-text-subtle"
          >
            {group}
          </p>
          <ul
            aria-labelledby={`nav-group-${group.toLowerCase()}`}
            className="flex flex-col gap-0.5"
          >
            {NAV_ITEMS.filter((item) => item.group === group).map((item) => (
              <li key={item.key}>
                <NavLink
                  to={item.path}
                  onClick={onNavigate}
                  className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}
                >
                  <item.icon className="size-[1.125rem] shrink-0" aria-hidden="true" />
                  <span>{item.title}</span>
                  {'adminArea' in item ? (
                    <span className="ml-auto rounded-sm border border-border-strong px-1.5 py-0.5 type-overline text-text-subtle">
                      Admin
                    </span>
                  ) : null}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}
