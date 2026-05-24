'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { generateBarterReceiptNow } from './actions'

export function GenerateNowButton({
  slug,
  defaultMonth,
  defaultMonthLabel,
}: {
  slug: string
  defaultMonth: string // 'YYYY-MM-DD'
  defaultMonthLabel: string // 'April 2026'
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleClick() {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await generateBarterReceiptNow({
        slug,
        receiptMonth: defaultMonth,
        sendEmail: false,
      })
      if (result.ok) {
        setSuccess(true)
        router.refresh()
      } else if (result.reason === 'no_bookings_in_month') {
        setError(`No bookings found in ${defaultMonthLabel}. Generate after the month has at least one round.`)
      } else {
        setError(`Generation failed: ${result.reason ?? 'unknown'}`)
      }
    })
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="bg-[#1B4332] text-[#FAF7F2] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#163829] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? 'Generating…' : `Generate Now (${defaultMonthLabel})`}
      </button>
      {success && (
        <p className="text-xs text-emerald-700">Receipt generated. Refreshing…</p>
      )}
      {error && (
        <p className="text-xs text-red-600 max-w-xs text-right">{error}</p>
      )}
    </div>
  )
}
