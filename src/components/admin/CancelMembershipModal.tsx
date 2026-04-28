'use client'
import { useState, useTransition } from 'react'
import { cancelMembership } from '@/app/admin/users/[userId]/actions'

interface CancelMembershipModalProps {
  userId: string
  periodEndDate: string | null
  hasMembership: boolean
}

export default function CancelMembershipModal({ userId, periodEndDate, hasMembership }: CancelMembershipModalProps) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const periodEndFormatted = periodEndDate
    ? new Date(periodEndDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  function handle(mode: 'now' | 'period_end') {
    startTransition(async () => {
      const result = await cancelMembership(userId, mode)
      if (result.error) { setError(result.error); return }
      setOpen(false)
    })
  }

  if (!hasMembership) return null

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
      >
        Cancel Membership
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl p-6 w-96 shadow-xl">
        <h2 className="font-bold text-lg mb-2">Cancel Membership</h2>
        <p className="text-sm text-[#6B7770] mb-5">Choose how to cancel this membership.</p>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <div className="space-y-3 mb-5">
          <button
            onClick={() => handle('now')}
            disabled={pending}
            className="w-full rounded-lg border-2 border-red-200 bg-red-50 p-4 text-left hover:border-red-400 transition-colors disabled:opacity-50"
          >
            <div className="font-semibold text-red-800">Cancel + Refund Now</div>
            <div className="text-sm text-red-600 mt-0.5">Ends immediately. Issues a pro-rated refund for unused days.</div>
          </button>
          <button
            onClick={() => handle('period_end')}
            disabled={pending}
            className="w-full rounded-lg border-2 border-amber-200 bg-amber-50 p-4 text-left hover:border-amber-400 transition-colors disabled:opacity-50"
          >
            <div className="font-semibold text-amber-800">Cancel at Period End</div>
            <div className="text-sm text-amber-600 mt-0.5">
              Member retains access until{periodEndFormatted ? ` ${periodEndFormatted}` : ' end of billing period'}.
            </div>
          </button>
        </div>
        <button onClick={() => setOpen(false)} className="w-full px-4 py-2 text-sm rounded-lg border border-black/15 text-[#6B7770]">
          Keep Membership
        </button>
      </div>
    </div>
  )
}
