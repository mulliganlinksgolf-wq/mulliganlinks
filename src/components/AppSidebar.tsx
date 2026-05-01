'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { SIDEBAR_NAV_ITEMS, isNavItemActive } from '@/lib/nav'

export default function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-56 fixed top-0 left-0 bottom-0 bg-[#1B4332] border-r border-[#0f2d1d]">
      <div className="p-5 border-b border-[#0f2d1d]">
        <Image
          src="/brand/teeahead-logo-primary.svg"
          alt="TeeAhead"
          width={140}
          height={37}
          className="h-8 w-auto brightness-0 invert"
        />
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {SIDEBAR_NAV_ITEMS.map((item) => {
          const active = isNavItemActive(pathname, item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                active
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-[#8FA889] hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-[#0f2d1d]">
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#8FA889] hover:text-white hover:bg-white/5"
          >
            <span>🚪</span>
            <span>Sign out</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
