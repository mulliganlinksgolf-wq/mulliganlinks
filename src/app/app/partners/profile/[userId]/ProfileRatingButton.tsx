'use client'

import { useState } from 'react'
import { RatingModal } from '@/components/RatingModal'

interface Props {
  connectionRequestId: string
  rateeId: string
  rateeName: string
}

export function ProfileRatingButton({ connectionRequestId, rateeId, rateeName }: Props) {
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)

  if (done) {
    return <span className="text-sm text-[#52B788] font-medium">Rating submitted ✓</span>
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full py-2.5 rounded-xl border border-[#E0A800]/40 text-[#E0A800] text-sm font-medium hover:bg-[#E0A800]/10 transition-colors"
      >
        ★ Rate your round with {rateeName}
      </button>
      {open && (
        <RatingModal
          connectionRequestId={connectionRequestId}
          rateeId={rateeId}
          rateeName={rateeName}
          onClose={() => setOpen(false)}
          onSubmitted={() => { setDone(true); setOpen(false) }}
        />
      )}
    </>
  )
}
