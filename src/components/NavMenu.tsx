'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const links = [
  { label: 'Home', href: '#top' },
  { label: 'For Courses', href: '#how-it-works-courses' },
  { label: 'For Golfers', href: '#for-golfers' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Barter Calculator', href: '/barter' },
]

export function NavMenu() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    setOpen(false)
    if (!href.startsWith('#')) return
    e.preventDefault()
    if (href === '#top') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        className="flex flex-col justify-center gap-[5px] w-9 h-9 rounded-md text-[#F4F1EA] hover:bg-white/10 transition-colors p-2"
      >
        <span className={`block h-0.5 w-5 bg-current rounded-full transition-all duration-200 origin-center ${open ? 'rotate-45 translate-y-[7px]' : ''}`} />
        <span className={`block h-0.5 w-5 bg-current rounded-full transition-all duration-200 ${open ? 'opacity-0' : ''}`} />
        <span className={`block h-0.5 w-5 bg-current rounded-full transition-all duration-200 origin-center ${open ? '-rotate-45 -translate-y-[7px]' : ''}`} />
      </button>

      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}

      <div className={`absolute right-0 top-full mt-2 w-52 rounded-xl bg-[#0a2e20] border border-white/10 shadow-2xl z-50 overflow-hidden transition-all duration-150 ${open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
        {links.map(({ label, href }) =>
          href.startsWith('/') ? (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block px-5 py-3 text-sm font-medium text-[#F4F1EA]/70 hover:text-[#F4F1EA] hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
            >
              {label}
            </Link>
          ) : (
            <a
              key={href}
              href={href}
              onClick={(e) => handleClick(e, href)}
              className="block px-5 py-3 text-sm font-medium text-[#F4F1EA]/70 hover:text-[#F4F1EA] hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
            >
              {label}
            </a>
          )
        )}

        <div className="px-4 py-3 bg-[#E0A800]/10 border-t border-[#E0A800]/20">
          <Link
            href="/waitlist/golfer"
            onClick={() => setOpen(false)}
            className="block text-center rounded-lg bg-[#E0A800] px-4 py-2 text-sm font-semibold text-[#0a0a0a] hover:bg-[#E0A800]/90 transition-colors"
          >
            Join the Waitlist
          </Link>
        </div>
      </div>
    </div>
  )
}
