'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const navItems = [
  { href: '/app', label: 'Dashboard', exact: true },
  { href: '/app/courses', label: 'Courses' },
  { href: '/app/bookings', label: 'Bookings' },
  { href: '/app/points', label: 'Points' },
  { href: '/app/card', label: 'My Card' },
  { href: '/app/profile', label: 'Profile' },
]

export function AppNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (item: typeof navItems[0]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)

  return (
    <header className="bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/app">
          <Image src="/logo.png" alt="MulliganLinks" width={566} height={496} className="h-16 w-auto" priority />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                isActive(item)
                  ? 'bg-[#1B4332]/10 text-[#1B4332]'
                  : 'text-[#6B7770] hover:text-[#1A1A1A]'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <form action="/api/auth/logout" method="post" className="ml-2">
            <button type="submit" className="px-3 py-1.5 text-sm text-[#6B7770] hover:text-[#1A1A1A]">
              Sign out
            </button>
          </form>
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="sm:hidden p-2 text-[#6B7770] hover:text-[#1A1A1A]"
          aria-label="Toggle menu"
        >
          {open ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="sm:hidden border-t border-gray-100 bg-white px-6 py-3 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`block px-3 py-2 rounded text-sm font-medium ${
                isActive(item)
                  ? 'bg-[#1B4332]/10 text-[#1B4332]'
                  : 'text-[#6B7770] hover:text-[#1A1A1A]'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <form action="/api/auth/logout" method="post">
            <button type="submit" className="block w-full text-left px-3 py-2 text-sm text-[#6B7770] hover:text-[#1A1A1A]">
              Sign out
            </button>
          </form>
        </div>
      )}
    </header>
  )
}
