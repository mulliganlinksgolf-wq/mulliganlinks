'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { isNavItemActive, type NavItem } from '@/lib/nav'

export default function AppBottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#0F3D2E]/10 flex items-center justify-around pt-2.5 pb-[18px]">
      {items.map((item) => {
        const active = isNavItemActive(pathname, item.href, item.exact)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-col items-center gap-0.5 ${
              active ? 'text-[#0F3D2E]' : 'text-[#6B7770]'
            }`}
          >
            <span className={`text-base leading-none ${active ? 'text-[#E0A800]' : ''}`}>{item.icon}</span>
            {item.badge && item.badge > 0 && (
              <span className="absolute -top-1 right-1.5 bg-[#C24A3B] text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-mono font-semibold">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
            <span className={`text-[10px] mt-0.5 ${active ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
