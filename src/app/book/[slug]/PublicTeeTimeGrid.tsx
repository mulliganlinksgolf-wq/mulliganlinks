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
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TZ,
  })
}

function localHour(iso: string) {
  // Extract hour from ISO string without timezone conversion
  // '2026-05-10T14:00:00+00:00' -> 14
  const match = iso.match(/T(\d{2}):\d{2}:\d{2}/)
  return match ? parseInt(match[1]) : 0
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

function TeeTimeCard({ tt, courseSlug }: { tt: TeeTime; courseSlug: string }) {
  const spotsLeft = tt.available_players
  const isLast = spotsLeft === 1

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm">
      <div>
        <p className="text-lg font-bold text-gray-900">{formatTime(tt.scheduled_at)}</p>
        <p className={`text-xs font-medium mt-0.5 ${isLast ? 'text-red-500' : 'text-gray-400'}`}>
          {isLast ? '1 spot left' : `${spotsLeft} spots left`}
        </p>
      </div>
      <p className="text-2xl font-bold text-[#1B4332]">${tt.base_price.toFixed(2)}</p>
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

  const morning = filtered.filter(tt => localHour(tt.scheduled_at) < 12)
  const afternoon = filtered.filter(tt => localHour(tt.scheduled_at) >= 12)

  return (
    <div className="space-y-6">
      {/* Date navigator */}
      <div className="flex items-center justify-between bg-[#1B4332] rounded-xl px-4 py-3 text-white">
        <Link
          href={`?date=${prevDate}`}
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
          Members save up to 15% ·{' '}
          <Link href="/signup" target="_blank" className="text-[#1B4332] font-medium hover:underline">
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
                {morning.map(tt => <TeeTimeCard key={tt.id} tt={tt} courseSlug={courseSlug} />)}
              </div>
            </div>
          )}
          {afternoon.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Afternoon</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {afternoon.map(tt => <TeeTimeCard key={tt.id} tt={tt} courseSlug={courseSlug} />)}
              </div>
            </div>
          )}
        </>
      )}

      {/* TeeAhead footer */}
      <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
        <p className="text-xs text-gray-400">Powered by</p>
        <Link href="https://teeahead.com" target="_blank" className="text-xs font-bold text-[#1B4332] hover:underline">
          TeeAhead
        </Link>
      </div>
    </div>
  )
}
