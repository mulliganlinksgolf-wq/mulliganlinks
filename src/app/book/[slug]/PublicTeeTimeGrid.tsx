'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface TeeTime {
  id: string
  scheduled_at: string
  available_players: number
  base_price: number
  special_price: number | null
  special_label: string | null
  /** Computed rate from the pricing engine (Sprint 6). NULL when no rules have fired yet
   *  or the cache hasn't been warmed for this slot. */
  computed_rate: number | null
  /** Labels of rules that fired, in priority order. First one is the most prominent. */
  fired_rule_labels: string[] | null
}

const TZ = 'America/Detroit'

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TZ,
  })
}

function localHour(iso: string) {
  const parts = new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: TZ }).formatToParts(new Date(iso))
  return Number(parts.find(p => p.type === 'hour')?.value ?? 0)
}

function formatDateLabel(s: string) {
  return new Date(s + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

function offsetDate(base: string, days: number) {
  const d = new Date(base + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function TeeTimeCard({ tt }: { tt: TeeTime }) {
  const spotsLeft = tt.available_players
  const isLast = spotsLeft === 1

  // Price resolution order: special_price (legacy manual deal) > computed_rate (pricing engine) > base_price
  const hasSpecial = tt.special_price != null
  const usingComputed = !hasSpecial && tt.computed_rate != null
  const ruleLabel = usingComputed ? tt.fired_rule_labels?.[0] ?? null : null

  const displayPrice = hasSpecial
    ? tt.special_price!
    : usingComputed
      ? tt.computed_rate!
      : tt.base_price

  // Strikethrough rack rate ONLY when the display price is lower than rack.
  // For price-ups (peak/holiday surcharge), we show the rate alone with the rule label.
  const showStrikethrough = displayPrice < tt.base_price

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm">
      {hasSpecial && tt.special_label && (
        <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">
          {tt.special_label}
        </p>
      )}
      {!hasSpecial && ruleLabel && (
        <p className="text-xs font-semibold text-[#1B4332] tracking-wide">
          {ruleLabel}
        </p>
      )}
      <div>
        <p className="text-lg font-bold text-gray-900">{formatTime(tt.scheduled_at)}</p>
        <p className={`text-xs font-medium mt-0.5 ${isLast ? 'text-red-500' : 'text-gray-400'}`}>
          {isLast ? '1 spot left' : `${spotsLeft} spots left`}
        </p>
      </div>
      <div>
        {showStrikethrough && (
          <p className="text-sm text-gray-400" style={{ textDecoration: 'line-through' }}>${tt.base_price.toFixed(2)}</p>
        )}
        <p className={`text-2xl font-bold ${showStrikethrough ? 'text-red-600' : 'text-[#1B4332]'}`}>
          ${displayPrice.toFixed(2)}
        </p>
      </div>
      <Link
        href={`/app/book/${tt.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center bg-[#1B4332] text-white text-sm font-semibold rounded-lg py-2 hover:bg-[#163d2a] transition-colors"
      >
        Book Now
      </Link>
    </div>
  )
}

function sortWithFeaturedFirst(tts: TeeTime[]): TeeTime[] {
  // Featured = special_price set OR computed_rate < base_price (price-down rule fired).
  // Price-ups (peak/holiday) are NOT featured — they sort by time like normal slots.
  return [...tts].sort((a, b) => {
    const aFeatured = a.special_price != null || (a.computed_rate != null && a.computed_rate < a.base_price) ? 1 : 0
    const bFeatured = b.special_price != null || (b.computed_rate != null && b.computed_rate < b.base_price) ? 1 : 0
    if (bFeatured !== aFeatured) return bFeatured - aFeatured
    return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  })
}

export function PublicTeeTimeGrid({
  teeTimes,
  courseName,
  courseSlug,
  selectedDate,
}: {
  teeTimes: TeeTime[]
  courseName: string
  courseSlug: string
  selectedDate: string
}) {
  const [golfers, setGolfers] = useState<number | null>(null)
  const [timeOfDay, setTimeOfDay] = useState<'any' | 'morning' | 'afternoon'>('any')

  const prevDate = offsetDate(selectedDate, -1)
  const nextDate = offsetDate(selectedDate, 1)

  const filtered = useMemo(() => {
    return teeTimes.filter(tt => {
      if (golfers !== null && tt.available_players < golfers) return false
      const h = localHour(tt.scheduled_at)
      if (timeOfDay === 'morning' && h >= 12) return false
      if (timeOfDay === 'afternoon' && h < 12) return false
      return true
    })
  }, [teeTimes, golfers, timeOfDay])

  const morning = sortWithFeaturedFirst(filtered.filter(tt => localHour(tt.scheduled_at) < 12))
  const afternoon = sortWithFeaturedFirst(filtered.filter(tt => localHour(tt.scheduled_at) >= 12))

  return (
    <div className="space-y-6">
      {/* Date navigator */}
      <div className="flex items-center justify-between bg-[#1B4332] rounded-xl px-4 py-3 text-white">
        <Link
          href={`?date=${prevDate}`}
          aria-label="Previous day"
          className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors text-lg"
        >
          ←
        </Link>
        <div className="text-center">
          <p className="text-xs text-white/60 uppercase tracking-wider">Tee times at</p>
          <p className="font-bold">{courseName}</p>
          <p className="text-sm text-[#A3C97A]">{formatDateLabel(selectedDate)}</p>
        </div>
        <Link
          href={`?date=${nextDate}`}
          aria-label="Next day"
          className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors text-lg"
        >
          →
        </Link>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Time of day */}
        <div className="flex gap-1 bg-gray-100 rounded-full p-1">
          {(['any', 'morning', 'afternoon'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTimeOfDay(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                timeOfDay === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'any' ? 'Any Time' : t === 'morning' ? 'Morning' : 'Afternoon'}
            </button>
          ))}
        </div>

        {/* Player count */}
        <div className="flex gap-1 bg-gray-100 rounded-full p-1">
          <button
            onClick={() => setGolfers(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              golfers === null ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Any
          </button>
          {[1, 2, 3, 4].map(n => (
            <button
              key={n}
              onClick={() => setGolfers(golfers === n ? null : n)}
              className={`w-8 h-7 rounded-full text-xs font-medium transition-all ${
                golfers === n ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-400 ml-auto">
          Members earn points on every round ·{' '}
          <Link href="/signup" target="_blank" rel="noopener noreferrer" className="text-[#1B4332] font-medium hover:underline">
            Join free →
          </Link>
        </p>
      </div>

      {/* Tee time grid */}
      {filtered.length === 0 ? (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No tee times available for this date.</p>
          <button
            onClick={() => { setGolfers(null); setTimeOfDay('any') }}
            className="mt-3 text-sm text-[#1B4332] underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          {morning.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Morning</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {morning.map(tt => <TeeTimeCard key={tt.id} tt={tt} />)}
              </div>
            </div>
          )}
          {afternoon.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Afternoon</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {afternoon.map(tt => <TeeTimeCard key={tt.id} tt={tt} />)}
              </div>
            </div>
          )}
        </>
      )}

      {/* TeeAhead footer */}
      <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
        <p className="text-xs text-gray-400">Powered by</p>
        <Link href="https://teeahead.com" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[#1B4332] hover:underline">
          TeeAhead
        </Link>
      </div>
    </div>
  )
}
