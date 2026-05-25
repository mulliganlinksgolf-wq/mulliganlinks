'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface TeeTime {
  id: string
  scheduled_at: string
  available_players: number
  base_price: number
  special_price?: number | null
  special_label?: string | null
  max_players?: number
  players_booked?: number
  is_partially_booked?: boolean
  has_self_grouped_bookings?: boolean
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
  isMovingFast,
  compact = false,
  joinMode = false,
}: {
  tt: TeeTime
  isMovingFast: boolean
  compact?: boolean
  joinMode?: boolean
}) {
  const hasDeal = tt.special_price != null
  const price = hasDeal ? tt.special_price! : tt.base_price
  const savings = hasDeal ? tt.base_price - tt.special_price! : 0
  const spotsLeft = tt.available_players
  const lastSpot = spotsLeft === 1

  return (
    <Link
      href={joinMode ? `/app/book/${tt.id}?join=1` : `/app/book/${tt.id}`}
      className={`
        relative flex flex-col items-center text-center rounded-xl border transition-all
        ${compact ? 'p-3 pt-5' : 'p-5 pt-6'}
        ${hasDeal
          ? 'border-[#E0A800]/70 bg-[#082419] hover:bg-[#0F3D2E]'
          : isMovingFast && lastSpot
          ? 'border-[#8FA889]/60 bg-[#082419] hover:bg-[#0F3D2E]'
          : isMovingFast
          ? 'border-[#E0A800]/70 bg-[#082419] hover:bg-[#0F3D2E]'
          : 'border-white/10 bg-[#082419] hover:border-[#E0A800]/50 hover:bg-[#0F3D2E]'
        }
      `}
    >
      {hasDeal && tt.special_label && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-[10px] tracking-[0.1em] uppercase font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap bg-[#E0A800] text-[#082419]">
          {tt.special_label}
        </div>
      )}
      {!hasDeal && isMovingFast && (
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-[10px] tracking-[0.1em] uppercase font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap
          ${lastSpot
            ? 'bg-[#8FA889] text-[#082419]'
            : 'bg-[#E0A800] text-[#082419]'
          }`}
        >
          {lastSpot ? '1 spot left' : `${spotsLeft} left`}
        </div>
      )}
      <p
        className={`font-display text-[#F4F1EA] leading-none tracking-[-0.02em] ${compact ? 'text-lg' : 'text-2xl'}`}
        style={{ fontWeight: 400 }}
      >
        {formatTime(tt.scheduled_at)}
      </p>
      <p
        className={`font-display text-[#E0A800] leading-none tracking-[-0.02em] ${compact ? 'text-base mt-1.5' : 'text-xl mt-2'}`}
        style={{ fontWeight: 400 }}
      >
        ${price.toFixed(2)}
      </p>
      {hasDeal ? (
        <>
          <p className="text-xs text-[#F4F1EA]/55 line-through mt-1">${tt.base_price.toFixed(2)}</p>
          {savings > 0 && (
            <p className="font-mono text-[10px] tracking-[0.08em] uppercase text-[#E0A800] font-semibold mt-0.5">Save ${savings.toFixed(2)}</p>
          )}
        </>
      ) : null}
      {!isMovingFast && !hasDeal && (
        <p className={`text-[#F4F1EA]/55 ${compact ? 'text-xs mt-1.5' : 'text-xs mt-2'}`}>
          {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
        </p>
      )}
      {hasDeal && (
        <p className={`text-[#F4F1EA]/55 ${compact ? 'text-xs mt-1.5' : 'text-xs mt-2'}`}>
          {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
        </p>
      )}
      {joinMode && (
        <p className={`font-mono text-[10px] tracking-[0.08em] uppercase text-[#8FA889] font-semibold ${compact ? 'mt-1.5' : 'mt-2'}`}>
          {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} open
        </p>
      )}
    </Link>
  )
}

function sortWithFeaturedFirst(tts: TeeTime[]): TeeTime[] {
  return [...tts].sort((a, b) => {
    const aFeatured = a.special_price != null ? 1 : 0
    const bFeatured = b.special_price != null ? 1 : 0
    if (bFeatured !== aFeatured) return bFeatured - aFeatured
    return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  })
}

export function TeeTimeSearch({
  teeTimes,
  courseName,
  selectedDate,
  tier,
  selfGroupingAvailable,
}: {
  teeTimes: TeeTime[]
  courseName: string
  courseSlug: string
  selectedDate: string
  tier: string
  selfGroupingAvailable?: boolean
}) {
  const [golfers, setGolfers] = useState<number | null>(null)
  const [timeOfDay, setTimeOfDay] = useState<'any' | 'early' | 'morning' | 'afternoon'>('any')
  const [fastOnly, setFastOnly] = useState(false)
  const [joinMode, setJoinMode] = useState(false)

  const prevDate = (() => { const d = new Date(selectedDate + 'T12:00:00'); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0] })()
  const nextDate = (() => { const d = new Date(selectedDate + 'T12:00:00'); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] })()

  const movingFast = useMemo(() => teeTimes.filter(tt => tt.available_players <= 2), [teeTimes])
  const joinable = useMemo(() => teeTimes.filter(tt => tt.is_partially_booked), [teeTimes])

  const filtered = useMemo(() => {
    return teeTimes.filter(tt => {
      // Join-mode short-circuits other compatibility filters: we only want partial slots.
      if (joinMode) {
        if (!tt.is_partially_booked) return false
      } else {
        if (golfers !== null && tt.available_players < golfers) return false
        if (fastOnly && tt.available_players > 2) return false
      }
      const h = localHour(tt.scheduled_at)
      if (timeOfDay === 'early' && h >= 9) return false
      if (timeOfDay === 'morning' && (h < 9 || h >= 12)) return false
      if (timeOfDay === 'afternoon' && h < 12) return false
      return true
    })
  }, [teeTimes, golfers, timeOfDay, fastOnly, joinMode])

  const morning = sortWithFeaturedFirst(filtered.filter(tt => localHour(tt.scheduled_at) < 12))
  const afternoon = sortWithFeaturedFirst(filtered.filter(tt => localHour(tt.scheduled_at) >= 12))

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
          onClick={() => { setFastOnly(v => !v); if (joinMode) setJoinMode(false) }}
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

        {/* Join an existing group toggle — only when course allows */}
        {selfGroupingAvailable && (
          <button
            type="button"
            onClick={() => { setJoinMode(v => !v); if (!joinMode) { setFastOnly(false); setGolfers(null) } }}
            title="Show only partial groups you can join — solo or small groups welcome"
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
              joinMode
                ? 'border-[#8FA889] bg-[#8FA889]/15 text-white'
                : 'border-[#0f2d1d] bg-[#163d2a] text-[#8FA889] hover:text-white hover:border-[#8FA889]'
            }`}
          >
            <span>Join an existing group</span>
            {joinable.length > 0 && (
              <span className={`text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold ${
                joinMode ? 'bg-[#8FA889] text-[#1A1A1A]' : 'bg-[#0f2d1d] text-[#8FA889]'
              }`}>
                {joinable.length}
              </span>
            )}
          </button>
        )}

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

        {/* Golfers — hidden in join mode; helper text shown instead */}
        {!joinMode ? (
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
        ) : (
          <p className="text-xs text-[#8FA889] italic">
            We&apos;ll match you to slots with at least 1 open spot.
          </p>
        )}

      </div>

      {/* Moving Fast carousel — hidden when joining an existing group */}
      {movingFast.length > 0 && !fastOnly && !joinMode && (
        <div>
          <h2 className="text-[9px] font-bold text-[#aaa] uppercase tracking-[0.2em] font-sans mb-4">
            Moving Fast at {courseName}
          </h2>
          <div className="flex gap-3 overflow-x-auto pt-3 pb-3 pr-4 scrollbar-hide">
            {movingFast.slice(0, 8).map(tt => (
              <div key={tt.id} className="flex-shrink-0 w-32">
                <TeeTimeCard tt={tt} isMovingFast compact />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tee time groups */}
      {filtered.length === 0 ? (
        <div className="bg-[#163d2a] rounded-xl border border-[#0f2d1d] p-12 text-center">
          <p className="text-[#8FA889]">
            {joinMode
              ? 'No partial groups open right now. Try another day, or turn off join mode to see all tee times.'
              : 'No tee times match your filters.'}
          </p>
          <button
            onClick={() => { setGolfers(null); setTimeOfDay('any'); setFastOnly(false); setJoinMode(false) }}
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
                {morning.map(tt => <TeeTimeCard key={tt.id} tt={tt} isMovingFast={isMovingFast(tt)} joinMode={joinMode} />)}
              </div>
            </div>
          )}
          {afternoon.length > 0 && (
            <div>
              <h2 className="text-[9px] font-semibold text-[#aaa] uppercase tracking-[0.2em] font-sans mb-3">Afternoon</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {afternoon.map(tt => <TeeTimeCard key={tt.id} tt={tt} isMovingFast={isMovingFast(tt)} joinMode={joinMode} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
