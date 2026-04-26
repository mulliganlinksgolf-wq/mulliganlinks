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
  isHot,
  compact = false,
}: {
  tt: TeeTime
  discountPct: number
  isHot: boolean
  compact?: boolean
}) {
  const price = tt.base_price * (1 - discountPct / 100)
  const spotsLeft = tt.available_players
  const lastSpot = spotsLeft === 1
  const twoLeft = spotsLeft === 2

  return (
    <Link
      href={`/app/book/${tt.id}`}
      className={`
        relative flex flex-col items-center text-center rounded-xl border-2 transition-all
        ${compact ? 'p-3' : 'p-5'}
        ${isHot && lastSpot
          ? 'border-orange-400 bg-orange-50 hover:bg-orange-100 shadow-sm'
          : isHot && twoLeft
          ? 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100'
          : 'border-gray-200 bg-white hover:border-[#1B4332] hover:shadow-sm'
        }
      `}
    >
      {isHot && (
        <div className={`absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap
          ${lastSpot ? 'bg-orange-500 text-white' : 'bg-yellow-400 text-[#1A1A1A]'}`}>
          {lastSpot ? '🔥 LAST SPOT' : '🔥 2 LEFT'}
        </div>
      )}
      <p className={`font-bold text-[#1A1A1A] ${compact ? 'text-base' : 'text-xl'}`}>
        {formatTime(tt.scheduled_at)}
      </p>
      <p className={`text-[#1B4332] font-semibold ${compact ? 'text-sm mt-0.5' : 'text-lg mt-1'}`}>
        ${price.toFixed(2)}
      </p>
      {discountPct > 0 && (
        <p className="text-xs text-[#6B7770] line-through">${tt.base_price.toFixed(2)}</p>
      )}
      <p className={`text-[#6B7770] ${compact ? 'text-xs mt-0.5' : 'text-sm mt-1.5'} ${lastSpot ? 'text-orange-600 font-semibold' : ''}`}>
        {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
      </p>
    </Link>
  )
}

export function TeeTimeSearch({
  teeTimes,
  courseName,
  courseSlug,
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
  const [hotOnly, setHotOnly] = useState(false)

  const prevDate = (() => { const d = new Date(selectedDate + 'T12:00:00'); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0] })()
  const nextDate = (() => { const d = new Date(selectedDate + 'T12:00:00'); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] })()

  const hotDeals = useMemo(() => teeTimes.filter(tt => tt.available_players <= 2), [teeTimes])

  const filtered = useMemo(() => {
    return teeTimes.filter(tt => {
      if (golfers !== null && tt.available_players < golfers) return false
      if (hotOnly && tt.available_players > 2) return false
      const h = localHour(tt.scheduled_at)
      if (timeOfDay === 'early' && h >= 9) return false
      if (timeOfDay === 'morning' && (h < 9 || h >= 12)) return false
      if (timeOfDay === 'afternoon' && h < 12) return false
      return true
    })
  }, [teeTimes, golfers, timeOfDay, hotOnly])

  const morning = filtered.filter(tt => localHour(tt.scheduled_at) < 12)
  const afternoon = filtered.filter(tt => localHour(tt.scheduled_at) >= 12)

  const isHot = (tt: TeeTime) => tt.available_players <= 2

  return (
    <div className="space-y-6">
      {/* Date navigator */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3">
        <Link href={`?date=${prevDate}`} className="p-2 rounded-lg hover:bg-gray-100 text-[#6B7770] transition-colors">
          ←
        </Link>
        <div className="text-center">
          <p className="text-sm text-[#6B7770]">Tee times at</p>
          <p className="font-bold text-[#1A1A1A]">{courseName}</p>
          <p className="text-sm font-medium text-[#1B4332]">{formatDate(selectedDate)}</p>
        </div>
        <Link href={`?date=${nextDate}`} className="p-2 rounded-lg hover:bg-gray-100 text-[#6B7770] transition-colors">
          →
        </Link>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Hot deals toggle */}
        <button
          onClick={() => setHotOnly(v => !v)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
            hotOnly
              ? 'border-orange-400 bg-orange-50 text-orange-700'
              : 'border-gray-200 bg-white text-[#6B7770] hover:border-gray-300'
          }`}
        >
          🔥 Hot Deals {hotDeals.length > 0 && <span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{hotDeals.length}</span>}
        </button>

        {/* Time */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-full p-1">
          {(['any', 'early', 'morning', 'afternoon'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTimeOfDay(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                timeOfDay === t ? 'bg-[#1B4332] text-[#FAF7F2]' : 'text-[#6B7770] hover:text-[#1A1A1A]'
              }`}
            >
              {t === 'any' ? 'Any Time' : t === 'early' ? 'Before 9AM' : t === 'morning' ? '9AM–12PM' : 'Afternoon'}
            </button>
          ))}
        </div>

        {/* Golfers */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-full p-1">
          <button
            onClick={() => setGolfers(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${golfers === null ? 'bg-[#1B4332] text-[#FAF7F2]' : 'text-[#6B7770] hover:text-[#1A1A1A]'}`}
          >
            Any
          </button>
          {[1, 2, 3, 4].map(n => (
            <button
              key={n}
              onClick={() => setGolfers(golfers === n ? null : n)}
              className={`w-8 h-7 rounded-full text-xs font-medium transition-all ${golfers === n ? 'bg-[#1B4332] text-[#FAF7F2]' : 'text-[#6B7770] hover:text-[#1A1A1A]'}`}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Tier badge */}
        {tier !== 'free' && (
          <span className="ml-auto text-xs px-3 py-1.5 rounded-full bg-[#E0A800]/20 text-[#8B6F00] font-semibold">
            {discountPct}% {tier} discount applied
          </span>
        )}
      </div>

      {/* Hot Deals carousel */}
      {hotDeals.length > 0 && !hotOnly && (
        <div>
          <h2 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wide mb-3">
            🔥 Hot Deals at {courseName}
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {hotDeals.slice(0, 8).map(tt => (
              <div key={tt.id} className="flex-shrink-0 w-28">
                <TeeTimeCard tt={tt} discountPct={discountPct} isHot compact />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tee time groups */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-[#6B7770]">No tee times match your filters.</p>
          <button
            onClick={() => { setGolfers(null); setTimeOfDay('any'); setHotOnly(false) }}
            className="mt-3 text-sm text-[#1B4332] underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          {morning.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[#6B7770] uppercase tracking-wide mb-3">Morning</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {morning.map(tt => <TeeTimeCard key={tt.id} tt={tt} discountPct={discountPct} isHot={isHot(tt)} />)}
              </div>
            </div>
          )}
          {afternoon.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[#6B7770] uppercase tracking-wide mb-3">Afternoon</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {afternoon.map(tt => <TeeTimeCard key={tt.id} tt={tt} discountPct={discountPct} isHot={isHot(tt)} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
