'use client'

import { useState } from 'react'
import { RatingModal } from '@/components/RatingModal'

export interface RatingPrompt {
  requestId: string
  rateeId: string
  rateeName: string
  dateLabel: string
}

export function PendingRatings({ prompts }: { prompts: RatingPrompt[] }) {
  const [active, setActive] = useState<RatingPrompt | null>(null)
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set())

  const visible = prompts.filter(p => !doneIds.has(p.requestId))
  if (visible.length === 0) return null

  return (
    <>
      <div className="rounded-2xl border border-[#E0A800]/30 bg-[#E0A800]/5 p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#E0A800]">
          ★ Rate your round
        </p>
        {visible.map(p => (
          <div key={p.requestId} className="flex items-center justify-between gap-3">
            <div>
              <p className="text-white text-sm font-medium">{p.rateeName}</p>
              <p className="text-[#8FA889] text-xs">{p.dateLabel}</p>
            </div>
            <button
              onClick={() => setActive(p)}
              className="flex-shrink-0 text-sm font-semibold px-4 py-2 rounded-xl bg-[#E0A800] text-[#1B4332] hover:bg-yellow-300 transition-colors"
            >
              Leave a rating
            </button>
          </div>
        ))}
      </div>

      {active && (
        <RatingModal
          connectionRequestId={active.requestId}
          rateeId={active.rateeId}
          rateeName={active.rateeName}
          onClose={() => setActive(null)}
          onSubmitted={() => {
            setDoneIds(prev => new Set([...prev, active.requestId]))
            setActive(null)
          }}
        />
      )}
    </>
  )
}
