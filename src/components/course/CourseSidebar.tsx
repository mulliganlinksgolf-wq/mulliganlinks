import Link from 'next/link'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'

type NavItem = { href: string; glyph: string; label: string; managerOnly?: boolean }

const NAV_TEMPLATE: NavItem[] = [
  { href: '',           glyph: '◷',  label: 'Tee sheet',     managerOnly: false },
  { href: 'check-in',   glyph: '◇',  label: 'Check-in',      managerOnly: false },
  { href: 'bookings',   glyph: '◐',  label: 'Bookings',      managerOnly: false },
  { href: 'members',    glyph: '◑',  label: 'Members',       managerOnly: false },
  { href: 'payments',   glyph: '◈',  label: 'Payments',      managerOnly: true  },
  { href: 'dashboard',  glyph: '◆',  label: 'Dashboard',     managerOnly: true  },
  { href: 'reports',    glyph: '⊞',  label: 'Reports',       managerOnly: true  },
  { href: 'marketing', glyph: '✉', label: 'Marketing', managerOnly: true },
  { href: 'leagues',    glyph: '◉',  label: 'Leagues',       managerOnly: true  },
  { href: 'trading',    glyph: '⇄',  label: 'Trading',       managerOnly: true  },
  { href: 'billing',    glyph: '◫',  label: 'Billing',       managerOnly: true  },
  { href: 'settings',   glyph: '✦',  label: 'Settings',      managerOnly: true  },
  { href: 'help',       glyph: '?',  label: 'Knowledge base',managerOnly: false },
]

export function CourseSidebar({
  slug, courseName, role, isManager, userInitials, userName,
}: {
  slug: string; courseName: string;
  role: string; isManager: boolean;
  userInitials: string; userName: string;
}) {
  const items = NAV_TEMPLATE.filter(i => !i.managerOnly || isManager)

  return (
    <aside className="w-16 sm:w-[220px] bg-[#082419] text-[#F4F1EA] flex flex-col flex-shrink-0">
      <div className="hidden sm:block px-5 pt-5 pb-5 border-b border-white/8">
        <Link href="/app">
          <TeeAheadLogo className="h-7 w-auto brightness-0 invert" />
        </Link>
        <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#E0A800] mt-1.5 truncate">{courseName}</p>
      </div>

      <nav className="flex flex-col py-3 flex-1 overflow-y-auto">
        {items.map((item) => {
          const href = item.href ? `/course/${slug}/${item.href}` : `/course/${slug}`
          return (
            <Link
              key={item.label}
              href={href}
              title={item.label}
              aria-label={item.label}
              className="flex items-center gap-3 px-5 py-2.5 text-sm transition-colors border-l-2 text-[#F4F1EA]/65 border-transparent hover:text-[#F4F1EA] hover:bg-white/[0.04]"
            >
              <span className="text-[13px] w-3.5 text-center text-[#F4F1EA]/50">{item.glyph}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="hidden sm:flex px-5 py-4 border-t border-white/8 items-center gap-2.5">
        <div className="size-8 rounded-full bg-[#E0A800] text-[#082419] font-display text-sm font-bold flex items-center justify-center flex-shrink-0">
          {userInitials}
        </div>
        <div className="min-w-0">
          <div className="text-[12.5px] truncate">{userName}</div>
          <div className="text-[10.5px] uppercase tracking-[0.1em] text-[#F4F1EA]/50 truncate">
            {role.replace('_', ' ')}
          </div>
        </div>
      </div>
    </aside>
  )
}
