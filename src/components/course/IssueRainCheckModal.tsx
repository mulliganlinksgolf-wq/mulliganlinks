'use client'

import { useState, useTransition } from 'react'
import { issueRainCheck } from '@/app/actions/rainCheck'

const PRESET_AMOUNTS = [25, 50, 75, 100]

interface Props {
  memberId: string
  memberName: string
  courseId: string
  suggestedAmountCents?: number
  onClose: () => void
}

export function IssueRainCheckModal({ memberId, memberName, courseId, suggestedAmountCents, onClose }: Props) {
  const [amountDollars, setAmountDollars] = useState(
    suggestedAmountCents ? String(suggestedAmountCents / 100) : '50',
  )
  const [note, setNote] = useState('')
  const [issued, setIssued] = useState<{ code: string; amount: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    const amountCents = Math.round(parseFloat(amountDollars) * 100)
    if (!amountCents || amountCents <= 0) return
    setError(null)
    startTransition(async () => {
      const result = await issueRainCheck({ memberId, courseId, amountCents, note: note || undefined })
      if (result.error) {
        setError(result.error)
      } else {
        setIssued({ code: result.code!, amount: amountCents })
      }
    })
  }

  if (issued) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-5 text-center">
          <div className="text-4xl">🌧️</div>
          <div>
            <p className="text-lg font-bold text-[#1A1A1A]">Rain check issued!</p>
            <p className="text-sm text-[#6B7770] mt-1">${(issued.amount / 100).toFixed(2)} for {memberName}</p>
          </div>
          <div className="bg-[#FAF7F2] rounded-xl py-4 px-6">
            <p className="text-xs text-[#6B7770] uppercase tracking-widest mb-1">Code</p>
            <p className="text-3xl font-bold text-[#1A1A1A] tracking-widest font-mono">{issued.code}</p>
            <p className="text-xs text-[#6B7770] mt-2">Member enters this at checkout. Valid 1 year.</p>
          </div>
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-[#1B4332] py-2.5 text-sm font-semibold text-[#FAF7F2] hover:bg-[#1B4332]/90"
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-[#1A1A1A]">Issue rain check</h2>
          <p className="text-sm text-[#6B7770] mt-1">For {memberName} — redeemable on a future booking</p>
        </div>

        {/* Quick-select amounts */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#1A1A1A]">Amount</label>
          <div className="flex gap-2 mb-2">
            {PRESET_AMOUNTS.map(a => (
              <button
                key={a}
                onClick={() => setAmountDollars(String(a))}
                className={`flex-1 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                  amountDollars === String(a)
                    ? 'bg-[#1B4332] text-[#FAF7F2] border-[#1B4332]'
                    : 'border-gray-200 text-[#1A1A1A] hover:border-[#1B4332]'
                }`}
              >
                ${a}
              </button>
            ))}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7770] text-sm">$</span>
            <input
              type="number"
              min="1"
              step="1"
              value={amountDollars}
              onChange={e => setAmountDollars(e.target.value)}
              className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#1A1A1A]">
            Note <span className="text-[#6B7770] font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="e.g. Rain delay — 9 holes played"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

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
            disabled={isPending || !amountDollars || parseFloat(amountDollars) <= 0}
            className="flex-1 rounded-lg bg-[#1B4332] py-2.5 text-sm font-semibold text-[#FAF7F2] hover:bg-[#1B4332]/90 disabled:opacity-40"
          >
            {isPending ? 'Issuing…' : 'Issue rain check'}
          </button>
        </div>
      </div>
    </div>
  )
}
