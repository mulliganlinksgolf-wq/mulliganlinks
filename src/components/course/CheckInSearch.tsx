'use client'

import { useState, useTransition } from 'react'
import { searchMembers, logRound } from '@/app/actions/checkIn'

const TIER_LABEL: Record<string, string> = { ace: 'Ace', eagle: 'Eagle', fairway: 'Fairway' }
const TIER_STYLE: Record<string, string> = {
  ace: 'bg-[#1B4332] text-[#FAF7F2]',
  eagle: 'bg-[#E0A800] text-[#1A1A1A]',
  fairway: 'bg-[#FAF7F2] text-[#1A1A1A] ring-1 ring-black/10',
}
const TIER_MULT: Record<string, number> = { ace: 3, eagle: 2, fairway: 1 }

type Member = {
  id: string
  full_name: string | null
  email: string | null
  memberships: { tier: string }[] | null
}

export default function CheckInSearch({
  courseId,
  courseName,
  slug,
}: {
  courseId: string
  courseName: string
  slug: string
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Member[]>([])
  const [selected, setSelected] = useState<Member | null>(null)
  const [greenFee, setGreenFee] = useState('')
  const [note, setNote] = useState('')
  const [confirmation, setConfirmation] = useState<{ pointsEarned: number; tier: string; multiplier: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSearch(value: string) {
    setQuery(value)
    setSelected(null)
    setConfirmation(null)
    if (value.length < 2) { setResults([]); return }
    const data = await searchMembers(value)
    setResults(data as Member[])
  }

  function handleSelect(member: Member) {
    setSelected(member)
    setResults([])
    setQuery(member.full_name ?? member.email ?? '')
    setGreenFee('')
    setNote('')
    setConfirmation(null)
    setError(null)
  }

  function handleLogRound() {
    const fee = parseFloat(greenFee)
    if (!selected || isNaN(fee) || fee <= 0) return
    setError(null)
    startTransition(async () => {
      const result = await logRound({
        memberId: selected.id,
        courseId,
        greenFee: fee,
        note,
      })
      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        setConfirmation({ pointsEarned: result.pointsEarned!, tier: result.tier!, multiplier: result.multiplier! })
        setSelected(null)
        setQuery('')
        setGreenFee('')
        setNote('')
      }
    })
  }

  const tier = selected?.memberships?.[0]?.tier ?? 'fairway'
  const mult = TIER_MULT[tier] ?? 1
  const fee = parseFloat(greenFee)
  const preview = !isNaN(fee) && fee > 0 ? Math.floor(fee * mult) : null

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="bg-white rounded-xl ring-1 ring-black/5 p-6 space-y-4">
        <label className="text-sm font-medium text-[#1A1A1A]">Find member</label>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full rounded-lg border border-black/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
          />
          {results.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white rounded-lg ring-1 ring-black/10 shadow-lg overflow-hidden">
              {results.map(m => {
                const t = m.memberships?.[0]?.tier ?? 'fairway'
                return (
                  <button
                    key={m.id}
                    onClick={() => handleSelect(m)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-[#FAF7F2] transition-colors text-left"
                  >
                    <div>
                      <span className="font-medium text-[#1A1A1A]">{m.full_name ?? '—'}</span>
                      <span className="text-[#6B7770] ml-2">{m.email}</span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TIER_STYLE[t]}`}>
                      {TIER_LABEL[t]}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Selected member + log round */}
      {selected && (
        <div className="bg-white rounded-xl ring-1 ring-black/5 p-6 space-y-5">
          {/* Member header */}
          <div className="flex items-center justify-between pb-4 border-b border-black/5">
            <div>
              <p className="font-bold text-[#1A1A1A] text-lg">{selected.full_name ?? 'Unknown'}</p>
              <p className="text-sm text-[#6B7770]">{selected.email}</p>
            </div>
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${TIER_STYLE[tier]}`}>
              {TIER_LABEL[tier]} · {mult}×
            </span>
          </div>

          {/* Round details */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1A1A1A]">Green fee paid</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7770] text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={greenFee}
                  onChange={e => setGreenFee(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-black/15 pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1A1A1A]">Note <span className="text-[#6B7770] font-normal">(optional)</span></label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="e.g. 18 holes, weekend rate"
                className="w-full rounded-lg border border-black/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
              />
            </div>

            {preview !== null && (
              <div className="bg-[#1B4332]/5 rounded-lg px-4 py-3 flex items-center justify-between text-sm">
                <span className="text-[#6B7770]">Points to award</span>
                <span className="font-bold text-[#1B4332] text-base">+{preview} pts</span>
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              onClick={handleLogRound}
              disabled={isPending || !greenFee || parseFloat(greenFee) <= 0}
              className="w-full rounded-lg bg-[#1B4332] py-3 text-sm font-semibold text-[#FAF7F2] hover:bg-[#1B4332]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? 'Awarding points…' : 'Log round & award points'}
            </button>
          </div>
        </div>
      )}

      {/* Confirmation */}
      {confirmation && (
        <div className="bg-[#1B4332] rounded-xl p-6 text-[#FAF7F2] text-center space-y-2">
          <div className="text-4xl">⛳</div>
          <p className="font-bold text-xl">+{confirmation.pointsEarned} Fairway Points awarded</p>
          <p className="text-[#FAF7F2]/70 text-sm">
            {TIER_LABEL[confirmation.tier]} member · {confirmation.multiplier}× multiplier
          </p>
          <button
            onClick={() => setConfirmation(null)}
            className="mt-4 text-sm text-[#FAF7F2]/70 hover:text-[#FAF7F2] underline"
          >
            Check in another member
          </button>
        </div>
      )}
    </div>
  )
}
