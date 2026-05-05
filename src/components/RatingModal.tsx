'use client'

import { useState, useTransition } from 'react'
import { submitRating } from '@/app/app/partners/actions'

interface RatingModalProps {
  connectionRequestId: string
  rateeId: string
  rateeName: string
  onClose: () => void
  onSubmitted: () => void
}

export function RatingModal({ connectionRequestId, rateeId, rateeName, onClose, onSubmitted }: RatingModalProps) {
  const [stars, setStars] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (stars === 0) { setError('Please select a star rating.'); return }
    setError(null)
    startTransition(async () => {
      const result = await submitRating(connectionRequestId, rateeId, stars, comment || undefined)
      if (result.error) { setError(result.error) } else { onSubmitted() }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#1B4332] rounded-2xl p-6 w-full max-w-sm mx-4 space-y-4">
        <div>
          <h2 className="text-white font-bold text-lg">Rate Your Round</h2>
          <p className="text-[#8FA889] text-sm mt-1">How was playing with <strong className="text-white">{rateeName}</strong>?</p>
        </div>

        <div className="flex gap-2 justify-center py-2">
          {[1,2,3,4,5].map(i => (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setStars(i)}
              className={`text-3xl transition-transform hover:scale-110 ${
                i <= (hovered || stars) ? 'text-[#E0A800]' : 'text-white/20'
              }`}
            >
              ★
            </button>
          ))}
        </div>

        <div>
          <label htmlFor="rating-comment" className="block text-sm font-medium text-white mb-1">
            Comment <span className="text-[#8FA889] font-normal">(optional)</span>
          </label>
          <textarea
            id="rating-comment"
            value={comment}
            onChange={e => setComment(e.target.value)}
            maxLength={280}
            rows={3}
            placeholder="Great round, very friendly pace…"
            className="w-full rounded-lg bg-white/10 border border-white/20 text-white px-3 py-2 text-sm placeholder:text-[#8FA889] resize-none"
          />
          <p className="text-xs text-[#8FA889] text-right mt-1">{comment.length} / 280</p>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/20">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isPending || stars === 0}
            className="flex-1 py-2.5 rounded-lg bg-white text-[#1B4332] text-sm font-semibold hover:bg-[#FAF7F2] disabled:opacity-50">
            {isPending ? 'Submitting…' : 'Submit Rating'}
          </button>
        </div>
      </div>
    </div>
  )
}
