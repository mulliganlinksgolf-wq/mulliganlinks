'use client'

import { useState, useTransition } from 'react'
import { waiveBooking } from '@/app/actions/teeTime'

const REASONS = [
  'Weather / rain check',
  'Course error or maintenance issue',
  'Customer dissatisfaction',
  'Goodwill / loyalty gesture',
  'Other',
]

interface Props {
  bookingId: string
  guestName: string
  totalPaid: number
  onClose: () => void
  onSuccess: () => void
}

export function WaiveFeeModal({ bookingId, guestName, totalPaid, onClose, onSuccess }: Props) {
  const [reason, setReason] = useState(REASONS[0])
  const [customReason, setCustomReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    const finalReason = reason === 'Other' ? customReason.trim() : reason
    if (!finalReason) return
    setError(null)
    startTransition(async () => {
      const result = await waiveBooking(bookingId, finalReason)
      if (result.error) {
        setError(result.error)
      } else {
        onSuccess()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-[#1A1A1A]">Waive fee</h2>
          <p className="text-sm text-[#6B7770] mt-1">
            {guestName} · ${totalPaid.toFixed(2)} — mark as no charge
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#1A1A1A]">Reason</label>
          <select
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
          >
            {REASONS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {reason === 'Other' && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#1A1A1A]">Describe reason</label>
            <input
              type="text"
              value={customReason}
              onChange={e => setCustomReason(e.target.value)}
              placeholder="Brief description…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
            />
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <p className="text-xs text-[#6B7770] bg-[#FAF7F2] rounded-lg px-3 py-2">
          This marks the booking fee as waived and reverses any Fairway Points awarded. Stripe
          refunds will be available once payment processing is live.
        </p>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-[#1A1A1A] hover:bg-gray-50 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || (reason === 'Other' && !customReason.trim())}
            className="flex-1 rounded-lg bg-[#1B4332] py-2.5 text-sm font-semibold text-[#FAF7F2] hover:bg-[#1B4332]/90 disabled:opacity-40"
          >
            {isPending ? 'Waiving…' : 'Waive fee'}
          </button>
        </div>
      </div>
    </div>
  )
}
