'use client'

import Link from 'next/link'
import { useState } from 'react'
import { track } from '@vercel/analytics'

import { useStoredValue } from '@/lib/use-stored-value'

const STORAGE_KEY = 'teeahead.golfer-banner-dismissed'

export default function GolferEscapeBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [stored, setStored] = useStoredValue(STORAGE_KEY)

  if (dismissed || stored === 'true') return null

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
          setStored('true')
          setDismissed(true)
        }}
      >
        ×
      </button>
    </div>
  )
}
