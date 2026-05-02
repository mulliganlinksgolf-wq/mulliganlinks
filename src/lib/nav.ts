export interface NavItem {
  href: string
  label: string
  icon: string
  exact?: boolean
}

export const SIDEBAR_NAV_ITEMS: NavItem[] = [
  { href: '/app',          label: 'Dashboard', icon: '⛳', exact: true },
  { href: '/app/courses',  label: 'Courses',   icon: '🗺️' },
  { href: '/app/bookings', label: 'Bookings',  icon: '📋' },
  { href: '/app/leagues',  label: 'Leagues',   icon: '🏆' },
  { href: '/app/points',   label: 'Points',    icon: '⭐' },
  { href: '/app/card',     label: 'My Card',   icon: '🃏' },
  { href: '/app/billing',  label: 'Billing',   icon: '💳' },
  { href: '/app/profile',  label: 'Profile',   icon: '👤' },
]

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { href: '/app',          label: 'Home',     icon: '⛳', exact: true },
  { href: '/app/courses',  label: 'Courses',  icon: '🗺️' },
  { href: '/app/bookings', label: 'Bookings', icon: '📋' },
  { href: '/app/leagues',  label: 'Leagues',  icon: '🏆' },
  { href: '/app/profile',  label: 'Profile',  icon: '👤' },
]

export function isNavItemActive(pathname: string, href: string, exact = false): boolean {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(href + '/')
}
