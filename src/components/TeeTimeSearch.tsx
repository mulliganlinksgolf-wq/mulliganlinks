'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface TeeTime {
  id: string
  scheduled_at: string
  available_players: number
  base_price: number
}

const TZ = 'America/Detroit'

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TZ })
}

function localHour(iso: string) {
  return parseInt(new Date(iso).toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: TZ }))
}

function formatDate(s: string) {
  return new Date(s + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function TeeTimeCard({
  tt,
  discountPct,
  isMovingFast,
  compact = false,
}: {
  tt: TeeTime
  discountPct: number
  isMovingFast: boolean
  compact?: boolean
}) {
  const price = tt.base_price * (1 - discountPct / 100)
  const spotsLeft = tt.available_players
  const lastSpot = spotsLeft === 1

  return (
    <Link
      href={`/app/book/${tt.id}`}
      className={`
        relative flex flex-col items-center text-center rounded-xl border-2 transition-all
        ${compact ? 'p-3 pt-5' : 'p-5 pt-6'}
        ${isMovingFast && lastSpot
          ? 'border-[#8FA889] bg-[#163d2a] hover:bg-[#1B4332]'
          : isMovingFast
          ? 'border-[#E0A800] bg-[#163d2a] hover:bg-[#1B4332]'
          : 'border-[#0f2d1d] bg-[#163d2a] hover:border-[#8FA889] hover:bg-[#1B4332]'
        }
      `}
    >
      {isMovingFast && (
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap
          ${lastSpot
            ? 'bg-[#8FA889] text-[#0f2d1d]'
            : 'bg-[#E0A800] text-[#1A1A1A]'
          }`}
        >
          {lastSpot ? '1 spot left' : `${spotsLeft} left`}
        </div>
      )}
      <p className={`font-bold text-white ${compact ? 'text-base' : 'text-xl'}`}>
        {formatTime(tt.scheduled_at)}
      </p>
      <p className={`text-[#E0A800] font-semibold ${compact ? 'text-sm mt-0.5' : 'text-lg mt-1'}`}>
        ${price.toFixed(2)}
      </p>
      {discountPct > 0 && (
        <p className="text-xs text-[#8FA889] line-through">${tt.base_price.toFixed(2)}</p>
      )}
      {!isMovingFast && (
        <p className={`text-[#8FA889] ${compact ? 'text-xs mt-0.5' : 'text-sm mt-1.5'}`}>
          {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
        </p>
      )}
    </Link>
  )
}

export function TeeTimeSearch({
  teeTimes,
  courseName,
  selectedDate,
  discountPct,
  tier,
}: {
  teeTimes: TeeTime[]
  courseName: string
  courseSlug: string
  selectedDate: string
  discountPct: number
  tier: string
}) {
  const [golfers, setGolfers] = useState<number | null>(null)
  const [timeOfDay, setTimeOfDay] = useState<'any' | 'early' | 'morning' | 'afternoon'>('any')
  const [fastOnly, setFastOnly] = useState(false)

  const prevDate = (() => { const d = new Date(selectedDate + 'T12:00:00'); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0] })()
  const nextDate = (() => { const d = new Date(selectedDate + 'T12:00:00'); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] })()

  const movingFast = useMemo(() => teeTimes.filter(tt => tt.available_players <= 2), [teeTimes])

  const filtered = useMemo(() => {
    return teeTimes.filter(tt => {
      if (golfers !== null && tt.available_players < golfers) return false
      if (fastOnly && tt.available_players > 2) return false
      const h = localHour(tt.scheduled_at)
      if (timeOfDay === 'early' && h >= 9) return false
      if (timeOfDay === 'morning' && (h < 9 || h >= 12)) return false
      if (timeOfDay === 'afternoon' && h < 12) return false
      return true
    })
  }, [teeTimes, golfers, timeOfDay, fastOnly])

  const morning = filtered.filter(tt => localHour(tt.scheduled_at) < 12)
  const afternoon = filtered.filter(tt => localHour(tt.scheduled_at) >= 12)

  const isMovingFast = (tt: TeeTime) => tt.available_players <= 2

  return (
    <div className="space-y-6">
      {/* Date navigator */}
      <div className="flex items-center justify-between bg-[#1B4332] rounded-xl border border-[#0f2d1d] px-4 py-3">
        <Link href={`?date=${prevDate}`} className="p-2 rounded-lg hover:bg-white/5 text-[#8FA889] hover:text-white transition-colors text-lg">
          ←
        </Link>
        <div className="text-center">
          <p className="text-sm text-[#8FA889]">Tee times at</p>
          <p className="font-bold text-white">{courseName}</p>
          <p className="text-sm font-medium text-[#E0A800]">{formatDate(selectedDate)}</p>
        </div>
        <Link href={`?date=${nextDate}`} className="p-2 rounded-lg hover:bg-white/5 text-[#8FA889] hover:text-white transition-colors text-lg">
          →
        </Link>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Moving Fast toggle */}
        <button
          onClick={() => setFastOnly(v => !v)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
            fastOnly
              ? 'border-[#E0A800] bg-[#E0A800]/10 text-[#E0A800]'
              : 'border-[#0f2d1d] bg-[#163d2a] text-[#8FA889] hover:text-white hover:border-[#8FA889]'
          }`}
        >
          <span>Moving Fast</span>
          {movingFast.length > 0 && (
            <span className={`text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold ${
              fastOnly ? 'bg-[#E0A800] text-[#1A1A1A]' : 'bg-[#0f2d1d] text-[#8FA889]'
            }`}>
              {movingFast.length}
            </span>
          )}
        </button>

        {/* Time */}
        <div className="flex gap-1 bg-[#163d2a] border border-[#0f2d1d] rounded-full p-1">
          {(['any', 'early', 'morning', 'afternoon'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTimeOfDay(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                timeOfDay === t ? 'bg-white/10 text-white' : 'text-[#8FA889] hover:text-white'
              }`}
            >
              {t === 'any' ? 'Any Time' : t === 'early' ? 'Before 9AM' : t === 'morning' ? '9AM–12PM' : 'Afternoon'}
            </button>
          ))}
        </div>

        {/* Golfers */}
        <div className="flex gap-1 bg-[#163d2a] border border-[#0f2d1d] rounded-full p-1">
          <button
            onClick={() => setGolfers(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${golfers === null ? 'bg-white/10 text-white' : 'text-[#8FA889] hover:text-white'}`}
          >
            Any
          </button>
          {[1, 2, 3, 4].map(n => (
            <button
              key={n}
              onClick={() => setGolfers(golfers === n ? null : n)}
              className={`w-8 h-7 rounded-full text-xs font-medium transition-all ${golfers === n ? 'bg-white/10 text-white' : 'text-[#8FA889] hover:text-white'}`}
            >
              {n}
            </button>
          ))}
        </div>

        {tier !== 'free' && (
          <span className="ml-auto text-xs px-3 py-1.5 rounded-full bg-[#E0A800]/20 text-[#E0A800] font-semibold">
            {discountPct}% {tier} discount applied
          </span>
        )}
      </div>

      {/* Moving Fast carousel */}
      {movingFast.length > 0 && !fastOnly && (
        <div>
          <h2 className="text-[9px] font-bold text-[#aaa] uppercase tracking-[0.2em] font-sans mb-4">
            Moving Fast at {courseName}
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
            {movingFast.slice(0, 8).map(tt => (
              <div key={tt.id} className="flex-shrink-0 w-32">
                <TeeTimeCard tt={tt} discountPct={discountPct} isMovingFast compact />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tee time groups */}
      {filtered.length === 0 ? (
        <div className="bg-[#163d2a] rounded-xl border border-[#0f2d1d] p-12 text-center">
          <p className="text-[#8FA889]">No tee times match your filters.</p>
          <button
            onClick={() => { setGolfers(null); setTimeOfDay('any'); setFastOnly(false) }}
            className="mt-3 text-sm text-[#E0A800] underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          {morning.length > 0 && (
            <div>
              <h2 className="text-[9px] font-semibold text-[#aaa] uppercase tracking-[0.2em] font-sans mb-3">Morning</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {morning.map(tt => <TeeTimeCard key={tt.id} tt={tt} discountPct={discountPct} isMovingFast={isMovingFast(tt)} />)}
              </div>
            </div>
          )}
          {afternoon.length > 0 && (
            <div>
              <h2 className="text-[9px] font-semibold text-[#aaa] uppercase tracking-[0.2em] font-sans mb-3">Afternoon</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {afternoon.map(tt => <TeeTimeCard key={tt.id} tt={tt} discountPct={discountPct} isMovingFast={isMovingFast(tt)} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
