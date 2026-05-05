'use client'

import { useState, useTransition } from 'react'
import { sendConnectionRequest } from '@/app/app/partners/actions'
import type { PartnerAvailability } from '@/types/partners'

function displayName(fullName: string | null): string {
  if (!fullName) return 'this member'
  const parts = fullName.trim().split(' ')
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

interface PartnerRequestModalProps {
  availability: PartnerAvailability
  onClose: () => void
  onSent: () => void
}

export function PartnerRequestModal({ availability, onClose, onSent }: PartnerRequestModalProps) {
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const name = displayName(availability.profile?.full_name ?? null)
  const dateLabel = new Date(availability.available_date + 'T12:00:00').toLocaleDateString(
    'en-US', { weekday: 'long', month: 'long', day: 'numeric' }
  )

  function handleSend() {
    setError(null)
    startTransition(async () => {
      const result = await sendConnectionRequest(
        availability.profile_id,
        availability.id,
        message || undefined
      )
      if (result.error) {
        setError(result.error)
      } else {
        onSent()
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#1B4332] rounded-2xl p-6 w-full max-w-sm mx-4 space-y-4">
        <div>
          <h2 className="text-white font-bold text-lg">Request to Play</h2>
          <p className="text-[#8FA889] text-sm mt-1">
            Sending to <strong className="text-white">{name}</strong> for {dateLabel}.
          </p>
        </div>

        <div>
          <label htmlFor="req-message" className="block text-sm font-medium text-white mb-1">
            Message <span className="text-[#8FA889] font-normal">(optional)</span>
          </label>
          <textarea
            id="req-message"
            value={message}
            onChange={e => setMessage(e.target.value)}
            maxLength={280}
            rows={3}
            placeholder="Introduce yourself or suggest a course…"
            className="w-full rounded-lg bg-white/10 border border-white/20 text-white px-3 py-2 text-sm placeholder:text-[#8FA889] resize-none"
          />
          <p className="text-xs text-[#8FA889] text-right mt-1">{message.length} / 280</p>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/20"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-lg bg-white text-[#1B4332] text-sm font-semibold hover:bg-[#FAF7F2] disabled:opacity-50"
          >
            {isPending ? 'Sending…' : 'Send Request'}
          </button>
        </div>
      </div>
    </div>
  )
}
