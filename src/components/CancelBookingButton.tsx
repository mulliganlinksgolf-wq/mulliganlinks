'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cancelBooking } from '@/app/actions/booking'

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const [confirm, setConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelBooking(bookingId)
      if (result.error) setError(result.error)
      else router.refresh()
    })
  }

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="text-sm text-red-500 hover:text-red-700 underline"
      >
        Cancel booking
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-[#6B7770]">Are you sure? This will free up the slot for other golfers.</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="text-sm px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          {isPending ? 'Canceling...' : 'Yes, cancel'}
        </button>
        <button onClick={() => setConfirm(false)} className="text-sm px-4 py-2 border rounded hover:bg-gray-50">
          Keep it
        </button>
      </div>
    </div>
  )
}
