'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { track } from '@vercel/analytics'

const STORAGE_KEY = 'teeahead.golfer-banner-dismissed'

export default function GolferEscapeBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === 'true') {
        setDismissed(true)
      }
    } catch {
      // localStorage unavailable (private mode); show the banner
    }
    setHydrated(true)
  }, [])

  if (hydrated && dismissed) return null

  return (
    <div className="bg-[#0F3D2E]/5 border border-[#0F3D2E]/15 px-4 py-3 text-[13px] text-[#0F3D2E] flex items-center justify-between">
      <span>
        Looking to play, not run a course?{' '}
        <Link
          href="/waitlist/golfer"
          className="underline underline-offset-2"
          onClick={() => track('homepage_golfer_banner_clicked', { source: 'hole_01' })}
        >
          Get on the loyalty waitlist →
        </Link>
      </span>
      <button
        type="button"
        aria-label="Dismiss"
        className="text-[#0F3D2E]/60 hover:text-[#0F3D2E] text-[16px] leading-none px-1"
        onClick={() => {
          try { window.localStorage.setItem(STORAGE_KEY, 'true') } catch {}
          setDismissed(true)
        }}
      >
        ×
      </button>
    </div>
  )
}
