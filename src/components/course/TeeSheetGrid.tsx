'use client'

import { useState } from 'react'

interface Booking {
  id: string
  players: number
  total_paid: number
  status: string
  profiles: { full_name: string } | null
}

interface TeeTime {
  id: string
  scheduled_at: string
  max_players: number
  available_players: number
  base_price: number
  status: string
  bookings: Booking[]
}

export function TeeSheetGrid({ teeTimes, slug }: { teeTimes: TeeTime[]; slug: string }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

  const statusColors: Record<string, string> = {
    open: 'bg-green-50 border-green-200',
    booked: 'bg-blue-50 border-blue-200',
    blocked: 'bg-gray-100 border-gray-300',
  }

  return (
    <div className="space-y-1">
      {/* Column headers */}
      <div className="grid grid-cols-12 gap-2 px-3 py-1 text-xs font-medium text-[#6B7770] uppercase tracking-wide">
        <div className="col-span-2">Time</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Players</div>
        <div className="col-span-2">Price</div>
        <div className="col-span-4">Booking</div>
      </div>

      {teeTimes.map(tt => {
        const isExpanded = expanded === tt.id
        const booking = tt.bookings?.[0]

        return (
          <div key={tt.id} className="rounded border bg-white overflow-hidden">
            <button
              onClick={() => setExpanded(isExpanded ? null : tt.id)}
              className={`w-full grid grid-cols-12 gap-2 px-3 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors border ${statusColors[tt.status] ?? 'bg-white border-gray-200'}`}
            >
              <div className="col-span-2 font-medium text-[#1A1A1A]">{formatTime(tt.scheduled_at)}</div>
              <div className="col-span-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  tt.status === 'open' ? 'bg-green-100 text-green-700' :
                  tt.status === 'booked' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {tt.status}
                </span>
              </div>
              <div className="col-span-2 text-[#6B7770]">
                {tt.max_players - tt.available_players}/{tt.max_players}
              </div>
              <div className="col-span-2 text-[#6B7770]">${tt.base_price.toFixed(2)}</div>
              <div className="col-span-4 text-[#6B7770] truncate">
                {booking ? booking.profiles?.full_name ?? 'Guest' : '—'}
              </div>
            </button>

            {isExpanded && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm space-y-2">
                {tt.bookings.length === 0 ? (
                  <p className="text-[#6B7770]">No bookings for this tee time.</p>
                ) : (
                  tt.bookings.map(b => (
                    <div key={b.id} className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-[#1A1A1A]">{b.profiles?.full_name ?? 'Guest'}</span>
                        <span className="text-[#6B7770] ml-2">{b.players} player{b.players !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[#1A1A1A]">${b.total_paid.toFixed(2)}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          b.status === 'completed' ? 'bg-[#8FA889]/30 text-[#1B4332]' :
                          'bg-red-100 text-red-700'
                        }`}>{b.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
