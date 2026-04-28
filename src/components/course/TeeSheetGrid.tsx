'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateTeeTimeStatus, updateBookingStatus } from '@/app/actions/teeTime'
import { WalkInBookingModal } from './WalkInBookingModal'
import { EditBookingModal } from './EditBookingModal'
import { WaiveFeeModal } from './WaiveFeeModal'
import { IssueRainCheckModal } from './IssueRainCheckModal'

interface Booking {
  id: string
  players: number
  total_paid: number
  status: string
  payment_status?: string | null
  points_awarded?: number
  user_id?: string | null
  guest_name: string | null
  guest_phone?: string | null
  payment_method?: string | null
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

interface EditTarget {
  booking: Booking
  teeTime: TeeTime
}

export function TeeSheetGrid({ teeTimes, slug, courseId }: { teeTimes: TeeTime[]; slug: string; courseId: string }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [bookingTeeTime, setBookingTeeTime] = useState<TeeTime | null>(null)
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)
  const [waiveTarget, setWaiveTarget] = useState<Booking | null>(null)
  const [rainCheckTarget, setRainCheckTarget] = useState<Booking | null>(null)
  const [, startTransition] = useTransition()
  const router = useRouter()

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Detroit',
    })

  const statusColors: Record<string, string> = {
    open: 'bg-green-50 border-green-200',
    full: 'bg-blue-50 border-blue-200',
    booked: 'bg-blue-50 border-blue-200',
    blocked: 'bg-red-50 border-red-200',
    completed: 'bg-gray-50 border-gray-200',
  }

  function handleBlock(id: string) {
    startTransition(() => updateTeeTimeStatus(id, 'blocked'))
  }
  function handleUnblock(id: string) {
    startTransition(() => updateTeeTimeStatus(id, 'open'))
  }
  function handleBookingStatus(id: string, status: 'completed' | 'no_show') {
    startTransition(() => updateBookingStatus(id, status))
  }

  function getDisplayName(b: Booking) {
    return b.profiles?.full_name ?? b.guest_name ?? 'Guest'
  }

  return (
    <>
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
          const bookedPlayers = tt.bookings.reduce((sum, b) => sum + b.players, 0)
          const allCompleted =
            tt.bookings.length > 0 && tt.bookings.every(b => b.status === 'completed')
          const displayStatus =
            tt.status === 'blocked'
              ? 'blocked'
              : allCompleted
              ? 'completed'
              : bookedPlayers >= tt.max_players
              ? 'full'
              : tt.status

          return (
            <div key={tt.id} className="rounded border bg-white overflow-hidden">
              <button
                onClick={() => setExpanded(isExpanded ? null : tt.id)}
                className={`w-full grid grid-cols-12 gap-2 px-3 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors border ${statusColors[displayStatus] ?? 'bg-white border-gray-200'}`}
              >
                <div className="col-span-2 font-medium text-[#1A1A1A]">
                  {formatTime(tt.scheduled_at)}
                </div>
                <div className="col-span-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      displayStatus === 'open'
                        ? 'bg-green-100 text-green-700'
                        : displayStatus === 'full'
                        ? 'bg-blue-100 text-blue-700'
                        : displayStatus === 'completed'
                        ? 'bg-gray-200 text-gray-600'
                        : displayStatus === 'blocked'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {displayStatus}
                  </span>
                </div>
                <div className="col-span-2 text-[#6B7770]">
                  {bookedPlayers}/{tt.max_players}
                </div>
                <div className="col-span-2 text-[#6B7770]">${tt.base_price.toFixed(2)}</div>
                <div className="col-span-4 text-[#6B7770] truncate">
                  {booking ? getDisplayName(booking) : '—'}
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
                          <span className="font-medium text-[#1A1A1A]">{getDisplayName(b)}</span>
                          <span className="text-[#6B7770] ml-2">
                            {b.players} player{b.players !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#1A1A1A]">${b.total_paid.toFixed(2)}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              b.status === 'confirmed'
                                ? 'bg-green-100 text-green-700'
                                : b.status === 'completed'
                                ? 'bg-[#8FA889]/30 text-[#1B4332]'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {b.status}
                          </span>
                          {b.status === 'confirmed' && (
                            <button
                              onClick={() => setEditTarget({ booking: b, teeTime: tt })}
                              className="text-xs px-2 py-0.5 border border-gray-300 rounded hover:bg-gray-100 text-[#6B7770]"
                            >
                              Edit
                            </button>
                          )}
                          {(b.status === 'completed' || b.status === 'no_show') &&
                            b.payment_status !== 'waived' &&
                            b.payment_status !== 'refunded' && (
                              <button
                                onClick={() => setWaiveTarget(b)}
                                className="text-xs px-2 py-0.5 border border-orange-300 rounded hover:bg-orange-50 text-orange-700"
                              >
                                Waive fee
                              </button>
                            )}
                          {(b.status === 'completed' || b.status === 'no_show') && b.user_id && (
                            <button
                              onClick={() => setRainCheckTarget(b)}
                              className="text-xs px-2 py-0.5 border border-blue-300 rounded hover:bg-blue-50 text-blue-700"
                            >
                              Rain check
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  {/* Slot-level actions */}
                  <div className="flex gap-2 mt-2 pt-2 border-t border-gray-200 flex-wrap">
                    {bookedPlayers < tt.max_players && displayStatus !== 'completed' && (
                      <button
                        onClick={() => setBookingTeeTime(tt)}
                        className="text-xs px-3 py-1 bg-[#1B4332] text-[#FAF7F2] rounded hover:bg-[#1B4332]/90"
                      >
                        Book walk-in
                      </button>
                    )}
                    {tt.status === 'open' && (
                      <button
                        onClick={() => handleBlock(tt.id)}
                        className="text-xs px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 text-[#6B7770]"
                      >
                        Close slot
                      </button>
                    )}
                    {tt.status === 'blocked' && (
                      <button
                        onClick={() => handleUnblock(tt.id)}
                        className="text-xs px-3 py-1 border border-[#1B4332] rounded hover:bg-[#1B4332]/5 text-[#1B4332]"
                      >
                        Open slot
                      </button>
                    )}
                    {tt.bookings.map(
                      b =>
                        b.status === 'confirmed' && (
                          <div key={b.id} className="flex gap-2">
                            <button
                              onClick={() => handleBookingStatus(b.id, 'completed')}
                              className="text-xs px-3 py-1 bg-[#1B4332] text-[#FAF7F2] rounded hover:bg-[#1B4332]/90"
                            >
                              Mark complete
                            </button>
                            <button
                              onClick={() => handleBookingStatus(b.id, 'no_show')}
                              className="text-xs px-3 py-1 border border-yellow-400 text-yellow-700 rounded hover:bg-yellow-50"
                            >
                              No show
                            </button>
                          </div>
                        )
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {bookingTeeTime && (
        <WalkInBookingModal
          teeTimeId={bookingTeeTime.id}
          availablePlayers={bookingTeeTime.available_players}
          basePrice={bookingTeeTime.base_price}
          scheduledAt={bookingTeeTime.scheduled_at}
          onClose={() => setBookingTeeTime(null)}
          onSuccess={() => {
            setBookingTeeTime(null)
            setExpanded(null)
            router.refresh()
          }}
        />
      )}

      {editTarget && (
        <EditBookingModal
          booking={editTarget.booking}
          isWalkIn={editTarget.booking.profiles === null}
          maxSelectablePlayers={editTarget.teeTime.available_players + editTarget.booking.players}
          basePrice={editTarget.teeTime.base_price}
          scheduledAt={editTarget.teeTime.scheduled_at}
          onClose={() => setEditTarget(null)}
          onSuccess={() => {
            setEditTarget(null)
            router.refresh()
          }}
        />
      )}

      {waiveTarget && (
        <WaiveFeeModal
          bookingId={waiveTarget.id}
          guestName={getDisplayName(waiveTarget)}
          totalPaid={waiveTarget.total_paid}
          onClose={() => setWaiveTarget(null)}
          onSuccess={() => {
            setWaiveTarget(null)
            router.refresh()
          }}
        />
      )}

      {rainCheckTarget && rainCheckTarget.user_id && (
        <IssueRainCheckModal
          memberId={rainCheckTarget.user_id}
          memberName={getDisplayName(rainCheckTarget)}
          courseId={courseId}
          suggestedAmountCents={Math.round(rainCheckTarget.total_paid * 100)}
          onClose={() => setRainCheckTarget(null)}
        />
      )}
    </>
  )
}
