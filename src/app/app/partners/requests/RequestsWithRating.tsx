'use client'

import { useState } from 'react'
import { RatingModal } from '@/components/RatingModal'
import { WithdrawButton } from './RequestActions'
import { markBooked } from '../actions'
import type { ConnectionRequest } from '@/types/partners'

function displayName(fullName: string | null): string {
  if (!fullName) return 'Member'
  const parts = fullName.trim().split(' ')
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

interface Props {
  requests: (ConnectionRequest & { availability: { available_date: string } | null })[]
  rateableIds: string[]
  otherPartyKey: 'requester' | 'recipient'
  statusBadge: Record<string, string>
  showWithdraw?: boolean
}

export function RequestsWithRating({ requests, rateableIds, otherPartyKey, statusBadge, showWithdraw }: Props) {
  const rateableSet = new Set(rateableIds)
  const [ratingTarget, setRatingTarget] = useState<{
    requestId: string
    rateeId: string
    rateeName: string
  } | null>(null)
  const [ratedIds, setRatedIds] = useState<Set<string>>(new Set())
  const [localBookedIds, setLocalBookedIds] = useState<Set<string>>(new Set())
  const [bookingIds, setBookingIds] = useState<Set<string>>(new Set())

  async function handleMarkBooked(requestId: string) {
    setBookingIds(prev => new Set([...prev, requestId]))
    const result = await markBooked(requestId)
    setBookingIds(prev => { const s = new Set(prev); s.delete(requestId); return s })
    if (!result?.error) setLocalBookedIds(prev => new Set([...prev, requestId]))
  }

  return (
    <>
      <div className="space-y-2">
        {requests.map(r => {
          const otherParty = (r as any)[otherPartyKey]
          const name = displayName(otherParty?.full_name ?? null)
          const rateable = rateableSet.has(r.id) && !ratedIds.has(r.id)
          const otherPartyId = otherPartyKey === 'requester' ? r.requester_id : r.recipient_id

          // If otherPartyKey === 'recipient', current user is the requester
          const iAmRequester = otherPartyKey === 'recipient'
          const iBooked = iAmRequester ? r.requester_booked : r.recipient_booked
          const theyBooked = iAmRequester ? r.recipient_booked : r.requester_booked
          const iBookedNow = localBookedIds.has(r.id)
          const isBooking = bookingIds.has(r.id)

          return (
            <div
              key={r.id}
              className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3 gap-3"
            >
              <div className="min-w-0">
                <p className="text-white text-sm font-medium">{name}</p>
                {r.availability?.available_date && (
                  <p className="text-[#8FA889] text-xs">
                    {new Date(r.availability.available_date + 'T12:00:00').toLocaleDateString(
                      'en-US', { weekday: 'short', month: 'short', day: 'numeric' }
                    )}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusBadge[r.status] ?? 'bg-white/10 text-[#8FA889]'}`}>
                  {r.status}
                </span>
                {r.status === 'accepted' && (
                  <a
                    href={`/app/partners/profile/${otherPartyId}`}
                    className="text-xs font-medium text-[#8FA889] hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/30 transition-colors"
                  >
                    View profile
                  </a>
                )}
                {r.status === 'accepted' && r.availability?.available_date && (
                  <a
                    href={`/app/courses?date=${r.availability.available_date}`}
                    className="text-xs font-medium text-white bg-[#1B4332] hover:bg-[#163d2a] px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Book a tee time →
                  </a>
                )}
                {r.status === 'accepted' && !iBooked && !iBookedNow && (
                  <button
                    onClick={() => handleMarkBooked(r.id)}
                    disabled={isBooking}
                    className="text-xs font-medium text-[#52B788] hover:text-white px-3 py-1.5 rounded-lg border border-[#52B788]/40 hover:border-white/30 transition-colors disabled:opacity-50"
                  >
                    {isBooking ? '…' : 'I booked! 🏌️'}
                  </button>
                )}
                {(iBooked || iBookedNow) && (
                  <span className="text-xs text-[#52B788] font-medium">You booked ✓</span>
                )}
                {theyBooked && !(iBooked || iBookedNow) && (
                  <span className="text-xs text-[#8FA889]">{name.split(' ')[0]} booked ✓</span>
                )}
                {showWithdraw && r.status === 'pending' && <WithdrawButton requestId={r.id} />}
                {rateable && (
                  <button
                    onClick={() => setRatingTarget({ requestId: r.id, rateeId: otherPartyId, rateeName: name })}
                    className="text-xs font-medium text-[#E0A800] hover:text-white px-2 py-1 rounded border border-[#E0A800]/30 hover:border-white/30 transition-colors"
                  >
                    ★ Rate
                  </button>
                )}
                {ratedIds.has(r.id) && (
                  <span className="text-xs text-[#52B788]">Rated ✓</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {ratingTarget && (
        <RatingModal
          connectionRequestId={ratingTarget.requestId}
          rateeId={ratingTarget.rateeId}
          rateeName={ratingTarget.rateeName}
          onClose={() => setRatingTarget(null)}
          onSubmitted={() => {
            setRatedIds(prev => new Set([...prev, ratingTarget.requestId]))
            setRatingTarget(null)
          }}
        />
      )}
    </>
  )
}
