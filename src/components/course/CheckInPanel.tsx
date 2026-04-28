'use client'

import { useState, useTransition } from 'react'
import { logRound } from '@/app/actions/checkIn'

const TIER_LABEL: Record<string, string> = { ace: 'Ace', eagle: 'Eagle', fairway: 'Fairway' }
const TIER_MULT: Record<string, number> = { ace: 3, eagle: 2, fairway: 1 }
const TIER_STYLE: Record<string, string> = {
  ace: 'bg-[#1B4332] text-[#FAF7F2]',
  eagle: 'bg-[#E0A800] text-[#1A1A1A]',
  fairway: 'bg-[#FAF7F2] text-[#1A1A1A] ring-1 ring-black/10',
}

interface Course {
  id: string
  name: string
  slug: string
}

interface Props {
  memberId: string
  memberName: string
  tier: string
  pointsBalance: number
  courses: Course[]
}

export function CheckInPanel({ memberId, memberName, tier, pointsBalance, courses }: Props) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '')
  const [greenFee, setGreenFee] = useState('')
  const [note, setNote] = useState('')
  const [confirmation, setConfirmation] = useState<{ pointsEarned: number; multiplier: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const mult = TIER_MULT[tier] ?? 1
  const fee = parseFloat(greenFee)
  const preview = !isNaN(fee) && fee > 0 ? Math.floor(fee * mult) : null

  function handleLog() {
    if (!courseId || isNaN(fee) || fee <= 0) return
    setError(null)
    startTransition(async () => {
      const result = await logRound({ memberId, courseId, greenFee: fee, note })
      if (result.error) {
        setError(result.error)
      } else {
        setConfirmation({ pointsEarned: result.pointsEarned!, multiplier: result.multiplier! })
      }
    })
  }

  if (confirmation) {
    return (
      <div className="bg-[#1B4332] rounded-2xl p-8 text-[#FAF7F2] text-center space-y-3">
        <div className="text-5xl">⛳</div>
        <p className="font-bold text-2xl">+{confirmation.pointsEarned} pts awarded</p>
        <p className="text-[#FAF7F2]/70 text-sm">
          {memberName} · {TIER_LABEL[tier]} · {confirmation.multiplier}× multiplier
        </p>
        <p className="text-[#FAF7F2]/60 text-xs mt-2">You can close this tab.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6 space-y-5">
      {/* Member badge */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <p className="text-sm text-[#6B7770]">Points balance</p>
          <p className="text-2xl font-bold text-[#1A1A1A]">{pointsBalance.toLocaleString()}</p>
        </div>
        <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${TIER_STYLE[tier]}`}>
          {TIER_LABEL[tier]} · {mult}×
        </span>
      </div>

      {/* Course selector — only shown if admin of multiple courses */}
      {courses.length > 1 && (
        <div>
          <label className="text-sm font-medium text-[#1A1A1A] block mb-1.5">Course</label>
          <select
            value={courseId}
            onChange={e => setCourseId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
          >
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Green fee */}
      <div>
        <label className="text-sm font-medium text-[#1A1A1A] block mb-1.5">Green fee paid</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7770] text-sm">$</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={greenFee}
            onChange={e => setGreenFee(e.target.value)}
            placeholder="0.00"
            className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
          />
        </div>
      </div>

      {/* Note */}
      <div>
        <label className="text-sm font-medium text-[#1A1A1A] block mb-1.5">
          Note <span className="text-[#6B7770] font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="e.g. 18 holes, weekend rate"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
        />
      </div>

      {/* Points preview */}
      {preview !== null && (
        <div className="bg-[#1B4332]/5 rounded-lg px-4 py-3 flex items-center justify-between text-sm">
          <span className="text-[#6B7770]">Points to award</span>
          <span className="font-bold text-[#1B4332] text-base">+{preview} pts</span>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleLog}
        disabled={isPending || !greenFee || fee <= 0}
        className="w-full rounded-lg bg-[#1B4332] py-3 text-sm font-semibold text-[#FAF7F2] hover:bg-[#1B4332]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isPending ? 'Awarding points…' : 'Log round & award points'}
      </button>
    </div>
  )
}
