'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { isNavItemActive, type NavItem } from '@/lib/nav'

export default function AppBottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1B4332] border-t border-[#0f2d1d] flex items-center justify-around py-2">
      {items.map((item) => {
        const active = isNavItemActive(pathname, item.href, item.exact)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-col items-center gap-0.5 text-[10px] font-medium ${
              active ? 'text-white' : 'text-[#8FA889]'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            {item.badge && item.badge > 0 && (
              <span className="absolute -top-0.5 right-0 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
