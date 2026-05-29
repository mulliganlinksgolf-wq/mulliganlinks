'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'

const NAV = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

// Single persistent marketing header used on every public route. Dual CTA always
// present: "I run a course" (operators) and "I'm a golfer" (golfers).
export function SiteHeader() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="sticky top-0 z-40 h-[60px] bg-[#082419] text-[#F4F1EA] border-b border-[#E0A800]/25 grid grid-cols-[auto_1fr_auto] items-center gap-6 px-6 sm:px-8 lg:px-10">
      {/* Left, logo */}
      <Link href="/" className="flex items-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E0A800]" aria-label="TeeAhead home">
        <TeeAheadLogo className="h-8 w-auto brightness-0 invert" />
      </Link>

      {/* Center, primary nav */}
      <nav className="hidden md:flex items-center justify-center gap-8">
        {NAV.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className="text-[13.5px] font-medium text-[#F4F1EA] hover:text-[#E0A800] rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E0A800] transition-colors"
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* Right, dual CTA (desktop) + hamburger (mobile) */}
      <div className="flex items-center gap-2.5 justify-end">
        <Link
          href="/waitlist/golfer"
          className="hidden sm:inline-flex rounded-md border border-[#E0A800] px-3.5 py-2 text-[13px] font-semibold text-[#E0A800] hover:bg-[#E0A800]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E0A800] transition-colors whitespace-nowrap"
        >
          I&apos;m a golfer
        </Link>
        <Link
          href="/waitlist/course"
          className="hidden sm:inline-flex rounded-md bg-[#E0A800] px-3.5 py-2 text-[13px] font-bold text-[#082419] hover:bg-[#E0A800]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4F1EA] transition-colors whitespace-nowrap"
        >
          I run a course →
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="md:hidden inline-flex items-center justify-center rounded-md p-1.5 text-[#F4F1EA] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E0A800]"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute top-0 right-0 h-full w-[80%] max-w-[320px] bg-[#082419] text-[#F4F1EA] flex flex-col p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <TeeAheadLogo className="h-7 w-auto brightness-0 invert" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="inline-flex items-center justify-center rounded-md p-1.5 text-[#F4F1EA] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E0A800]"
              >
                <X size={22} />
              </button>
            </div>
            <nav className="flex flex-col gap-1 text-[#F4F1EA]">
              {NAV.map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="py-3 text-[15px] font-medium border-b border-white/10 hover:text-[#E0A800] transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div className="mt-6 flex flex-col gap-2.5">
              <Link
                href="/waitlist/course"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center rounded-md bg-[#E0A800] px-4 py-3 text-[14px] font-bold text-[#082419] hover:bg-[#E0A800]/90 transition-colors"
              >
                I run a course →
              </Link>
              <Link
                href="/waitlist/golfer"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center rounded-md border border-[#E0A800] px-4 py-3 text-[14px] font-semibold text-[#E0A800] hover:bg-[#E0A800]/10 transition-colors"
              >
                I&apos;m a golfer
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
