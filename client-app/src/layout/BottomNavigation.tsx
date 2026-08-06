import { NavLink } from 'react-router'

type NavigationItem = {
  icon: 'today' | 'reports' | 'research' | 'mine'
  label: string
  path: string
}

const navigationItems: readonly NavigationItem[] = [
  { label: '今日', path: '/today', icon: 'today' },
  { label: '报告库', path: '/reports', icon: 'reports' },
  { label: '研究', path: '/research', icon: 'research' },
  { label: '我的', path: '/mine', icon: 'mine' },
]

type NavigationIconProps = {
  active: boolean
  icon: NavigationItem['icon']
}

function NavigationIcon({ active, icon }: NavigationIconProps) {
  const paths = {
    today: <><path d="M4 6.5h16v13H4z" /><path d="M7 3.5v5M17 3.5v5M7 12h10M7 16h6" /></>,
    reports: <><path d="M6 3.5h9l3 3v14H6z" /><path d="M15 3.5v4h4M9 12h6M9 16h6" /></>,
    research: <><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4M11 8v6M8 11h6" /></>,
    mine: <><circle cx="12" cy="8" r="4" /><path d="M4.5 20c.8-3.4 3.3-5.5 7.5-5.5s6.7 2.1 7.5 5.5" /></>,
  } as const

  return (
    <svg aria-hidden="true" className="bottom-navigation__icon" data-active={active ? 'true' : 'false'} viewBox="0 0 24 24">
      {paths[icon]}
    </svg>
  )
}

export function BottomNavigation() {
  return (
    <nav aria-label="主导航" className="bottom-navigation">
      {navigationItems.map(({ icon, label, path }) => (
        <NavLink
          key={path}
          className={({ isActive }) => `bottom-navigation__link${isActive ? ' bottom-navigation__link--active' : ''}`}
          to={path}
        >
          {({ isActive }) => <><NavigationIcon active={isActive} icon={icon} /><span>{label}</span></>}
        </NavLink>
      ))}
    </nav>
  )
}
