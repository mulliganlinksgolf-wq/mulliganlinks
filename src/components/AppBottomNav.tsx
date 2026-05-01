'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BOTTOM_NAV_ITEMS, isNavItemActive } from '@/lib/nav'

export default function AppBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1B4332] border-t border-[#0f2d1d] flex items-center justify-around py-2">
      {BOTTOM_NAV_ITEMS.map((item) => {
        const active = isNavItemActive(pathname, item.href, item.exact)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-medium ${
              active ? 'text-white' : 'text-[#8FA889]'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
