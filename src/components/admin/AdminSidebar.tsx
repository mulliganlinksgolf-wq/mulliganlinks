'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface AdminSidebarProps {
  userEmail: string
  openDisputeCount: number
}

export default function AdminSidebar({ userEmail, openDisputeCount }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-52 flex-shrink-0 bg-slate-900 text-slate-200 flex flex-col min-h-screen">
      <div className="px-4 py-4 font-bold text-white border-b border-slate-800">
        <span className="sr-only">TeeAhead</span>
        <span aria-hidden="true">Tee<span className="text-emerald-400">Ahead</span></span>
        {' '}Admin
      </div>

      <nav className="flex-1 py-2">
        <SidebarItem href="/admin" icon="📊" label="Dashboard" active={pathname === '/admin'} />

        <SidebarSection label="Members" />
        <SidebarItem href="/admin/users" icon="👥" label="All Members" active={pathname.startsWith('/admin/users')} />
        <SidebarItem href="/admin/communications" icon="✉️" label="Communications" active={pathname === '/admin/communications'} />

        <SidebarSection label="Finance" />
        <SidebarItem
          href="/admin/disputes"
          icon="⚠️"
          label="Disputes"
          active={pathname === '/admin/disputes'}
          badge={openDisputeCount > 0 ? openDisputeCount : undefined}
        />

        <SidebarSection label="Reports" />
        <SidebarItem href="/admin/reports/financial" icon="💰" label="Financial" active={pathname.startsWith('/admin/reports/financial')} />
        <SidebarItem href="/admin/reports/members" icon="📈" label="Members" active={pathname.startsWith('/admin/reports/members')} />
        <SidebarItem href="/admin/reports/courses" icon="🏌️" label="Courses" active={pathname.startsWith('/admin/reports/courses')} />

        <SidebarSection label="Platform" />
        <SidebarItem href="/admin/content" icon="📝" label="Content" active={pathname === '/admin/content'} />
        <SidebarItem href="/admin/courses" icon="🏌️" label="Courses" active={pathname.startsWith('/admin/courses')} />
        <SidebarItem href="/admin/waitlist" icon="📋" label="Waitlist" active={pathname === '/admin/waitlist'} />

        <SidebarSection label="CRM" />
        <SidebarItem href="/admin/crm" icon="🏢" label="CRM Dashboard" active={pathname === '/admin/crm'} />
        <SidebarItem href="/admin/crm/courses" icon="⛳" label="Courses" active={pathname.startsWith('/admin/crm/courses')} />
        <SidebarItem href="/admin/crm/outings" icon="🏌️" label="Outings" active={pathname.startsWith('/admin/crm/outings')} />
        <SidebarItem href="/admin/crm/members" icon="👤" label="Members" active={pathname.startsWith('/admin/crm/members')} />
        <SidebarItem href="/admin/crm/email-templates" icon="✉️" label="Email Templates" active={pathname.startsWith('/admin/crm/email-templates')} />

        <SidebarSection label="Settings" />
        <SidebarItem href="/admin/config" icon="⚙️" label="Configuration" active={pathname === '/admin/config'} />
        <SidebarItem href="/admin/audit" icon="🔍" label="Audit Log" active={pathname === '/admin/audit'} />
      </nav>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-400">
        <div>Signed in as</div>
        <div className="text-slate-300 truncate">{userEmail}</div>
        <Link href="/app" className="text-emerald-400 hover:text-emerald-300 mt-1 block">
          ← Member view
        </Link>
      </div>
    </aside>
  )
}

function SidebarSection({ label }: { label: string }) {
  return (
    <div className="px-4 pt-3 pb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
      {label}
    </div>
  )
}

function SidebarItem({
  href,
  icon,
  label,
  active,
  badge,
}: {
  href: string
  icon: string
  label: string
  active: boolean
  badge?: number
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-4 py-1.5 text-sm border-l-[3px] transition-colors ${
        active
          ? 'bg-slate-800 text-white border-emerald-400'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white border-transparent hover:border-emerald-400'
      }`}
    >
      <span className="w-4 text-center">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge !== undefined && (
        <span data-testid="dispute-badge" className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </Link>
  )
}
