'use client'

import { useState, useTransition } from 'react'
import { updateBooking } from '@/app/actions/teeTime'

type PaymentMethod = 'cash' | 'card'

interface Props {
  booking: {
    id: string
    players: number
    total_paid: number
    payment_method: string | null
    guest_name: string | null
    guest_phone: string | null
  }
  isWalkIn: boolean
  maxSelectablePlayers: number // available_players + current booking.players
  basePrice: number
  scheduledAt: string
  onClose: () => void
  onSuccess: () => void
}

export function EditBookingModal({
  booking,
  isWalkIn,
  maxSelectablePlayers,
  basePrice,
  scheduledAt,
  onClose,
  onSuccess,
}: Props) {
  const [players, setPlayers] = useState(booking.players)
  const [totalPaid, setTotalPaid] = useState(booking.total_paid.toFixed(2))
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    booking.payment_method === 'card' ? 'card' : 'cash'
  )
  const [guestName, setGuestName] = useState(booking.guest_name ?? '')
  const [guestPhone, setGuestPhone] = useState(booking.guest_phone ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Detroit',
    })

  function handlePlayersChange(n: number) {
    setPlayers(n)
    setTotalPaid((basePrice * n).toFixed(2))
  }

  function handleSubmit() {
    setError(null)
    if (isWalkIn && !guestName.trim()) {
      setError('Name is required.')
      return
    }
    startTransition(async () => {
      const result = await updateBooking({
        bookingId: booking.id,
        players,
        totalPaid: parseFloat(totalPaid) || 0,
        paymentMethod,
        ...(isWalkIn && { guestName: guestName.trim(), guestPhone: guestPhone.trim() }),
      })
      if (result?.error) setError(result.error)
      else onSuccess()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <p className="font-semibold text-[#1A1A1A]">Edit Booking</p>
            <p className="text-xs text-[#6B7770] mt-0.5">{formatTime(scheduledAt)}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-[#6B7770] hover:text-[#1A1A1A] text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Name / phone — walk-ins only */}
          {isWalkIn && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[#6B7770] block mb-1">Name *</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4332]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#6B7770] block mb-1">Phone</label>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={e => setGuestPhone(e.target.value)}
                  placeholder="Optional"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4332]"
                />
              </div>
            </div>
          )}

          {/* Players */}
          <div>
            <label className="text-xs font-medium text-[#6B7770] block mb-2">Players</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(n => (
                <button
                  key={n}
                  onClick={() => handlePlayersChange(n)}
                  disabled={n > maxSelectablePlayers}
                  className={`w-12 h-10 rounded-lg border text-sm font-semibold transition-colors ${
                    players === n
                      ? 'bg-[#1B4332] text-[#FAF7F2] border-[#1B4332]'
                      : n > maxSelectablePlayers
                      ? 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed'
                      : 'bg-white text-[#1A1A1A] border-gray-200 hover:border-[#1B4332]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Amount paid */}
          <div>
            <label className="text-xs font-medium text-[#6B7770] block mb-1">Amount paid ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={totalPaid}
              onChange={e => setTotalPaid(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4332]"
            />
          </div>

          {/* Payment method */}
          <div>
            <label className="text-xs font-medium text-[#6B7770] block mb-2">Payment method</label>
            <div className="flex gap-2">
              {(['cash', 'card'] as PaymentMethod[]).map(m => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`flex-1 py-1.5 text-sm rounded-lg border font-medium transition-colors ${
                    paymentMethod === m
                      ? 'bg-[#1B4332] text-[#FAF7F2] border-[#1B4332]'
                      : 'text-[#6B7770] border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-sm text-[#6B7770] border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="px-4 py-2 text-sm bg-[#1B4332] text-[#FAF7F2] rounded-lg hover:bg-[#1B4332]/90 disabled:opacity-50"
          >
            {isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
