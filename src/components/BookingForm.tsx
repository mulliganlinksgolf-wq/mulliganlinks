'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { confirmBooking } from '@/app/actions/booking'
import { lookupRainCheck } from '@/app/actions/rainCheck'

interface TeeTime {
  id: string
  scheduled_at: string
  available_players: number
  base_price: number
  courses: { id: string; name: string; slug: string }
}

const DISCOUNT: Record<string, number> = { free: 0, eagle: 10, ace: 15 }
const MULTIPLIER: Record<string, number> = { free: 1, fairway: 1, eagle: 1.5, ace: 2 }

export function BookingForm({
  teeTime,
  tier,
  pointsBalance,
  creditBalanceCents = 0,
  userId,
}: {
  teeTime: TeeTime
  tier: string
  pointsBalance: number
  creditBalanceCents?: number
  userId: string
}) {
  const [players, setPlayers] = useState(1)
  const [usePoints, setUsePoints] = useState(false)
  const [useCredits, setUseCredits] = useState(false)
  const [rainCheckCode, setRainCheckCode] = useState('')
  const [rainCheck, setRainCheck] = useState<{ id: string; amountCents: number } | null>(null)
  const [rainCheckError, setRainCheckError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const discountPct = DISCOUNT[tier] ?? 0
  const multiplier = MULTIPLIER[tier] ?? 1
  const subtotal = teeTime.base_price * players
  const discount = subtotal * (discountPct / 100)
  const afterDiscount = subtotal - discount
  // Apply in order: credits → rain check → points
  const creditsValue = useCredits ? Math.min(creditBalanceCents / 100, afterDiscount) : 0
  const afterCredits = afterDiscount - creditsValue
  const rainCheckValue = rainCheck ? Math.min(rainCheck.amountCents / 100, afterCredits) : 0
  const afterRainCheck = afterCredits - rainCheckValue
  // 100 points = $1
  const pointsValue = usePoints ? Math.min(pointsBalance / 100, afterRainCheck) : 0
  const total = Math.max(0, afterRainCheck - pointsValue)
  const pointsEarned = Math.floor(total * multiplier)

  function handleSubmit() {
    setError(null)
    startTransition(async () => {
      const result = await confirmBooking({
        teeTimeId: teeTime.id,
        userId,
        players,
        subtotal,
        discount,
        pointsRedeemed: usePoints ? Math.round(pointsValue * 100) : 0,
        creditsRedeemedCents: useCredits ? Math.round(creditsValue * 100) : 0,
        rainCheckId: rainCheck?.id,
        total,
        pointsEarned,
        tier,
      })
      if (result.error) {
        setError(result.error)
      } else {
        router.push(`/app/bookings/${result.bookingId}`)
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Players */}
      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="pt-5 pb-5">
          <p className="text-sm font-medium text-[#1A1A1A] mb-3">Number of players</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(n => (
              <button
                key={n}
                onClick={() => setPlayers(n)}
                disabled={n > teeTime.available_players}
                className={`w-12 h-12 rounded-lg border text-sm font-semibold transition-colors ${
                  players === n
                    ? 'bg-[#1B4332] text-[#FAF7F2] border-[#1B4332]'
                    : n > teeTime.available_players
                    ? 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed'
                    : 'bg-white text-[#1A1A1A] border-gray-200 hover:border-[#1B4332]'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Price breakdown */}
      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="pt-5 pb-5 space-y-2 text-sm">
          <div className="flex justify-between text-[#6B7770]">
            <span>${teeTime.base_price.toFixed(2)} × {players} player{players !== 1 ? 's' : ''}</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {discountPct > 0 && (
            <div className="flex justify-between text-[#1B4332]">
              <span>{discountPct}% member discount</span>
              <span>−${discount.toFixed(2)}</span>
            </div>
          )}
          {creditBalanceCents > 0 && (
            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
              <button
                onClick={() => setUseCredits(!useCredits)}
                className="flex items-center gap-2 text-[#6B7770] hover:text-[#1A1A1A]"
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${useCredits ? 'bg-[#E0A800] border-[#E0A800]' : 'border-gray-300'}`}>
                  {useCredits && <span className="text-white text-xs">✓</span>}
                </div>
                ${(creditBalanceCents / 100).toFixed(2)} member credit
              </button>
              {useCredits && <span className="text-[#E0A800] font-medium">−${creditsValue.toFixed(2)}</span>}
            </div>
          )}
          {/* Rain check input */}
          <div className="pt-1 border-t border-gray-100 space-y-1.5">
            {rainCheck ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700 font-medium">
                  Rain check {rainCheckCode.toUpperCase()} applied
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-blue-700">−${rainCheckValue.toFixed(2)}</span>
                  <button onClick={() => { setRainCheck(null); setRainCheckCode(''); setRainCheckError(null) }} className="text-xs text-[#6B7770] underline">Remove</button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={rainCheckCode}
                  onChange={e => { setRainCheckCode(e.target.value.toUpperCase()); setRainCheckError(null) }}
                  placeholder="Rain check code"
                  maxLength={8}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 uppercase tracking-widest font-mono"
                />
                <button
                  onClick={() => {
                    if (!rainCheckCode.trim()) return
                    startTransition(async () => {
                      const result = await lookupRainCheck(rainCheckCode)
                      if (result.error) {
                        setRainCheckError(result.error)
                      } else {
                        setRainCheck({ id: result.id!, amountCents: result.amountCents! })
                        setRainCheckError(null)
                      }
                    })
                  }}
                  disabled={!rainCheckCode.trim() || isPending}
                  className="px-3 py-2 text-sm font-medium bg-[#1B4332] text-[#FAF7F2] rounded-lg hover:bg-[#1B4332]/90 disabled:opacity-40"
                >
                  Apply
                </button>
              </div>
            )}
            {rainCheckError && <p className="text-xs text-red-600">{rainCheckError}</p>}
          </div>

          {pointsBalance > 0 && (
            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
              <button
                onClick={() => setUsePoints(!usePoints)}
                className="flex items-center gap-2 text-[#6B7770] hover:text-[#1A1A1A]"
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${usePoints ? 'bg-[#1B4332] border-[#1B4332]' : 'border-gray-300'}`}>
                  {usePoints && <span className="text-white text-xs">✓</span>}
                </div>
                Use {pointsBalance} points (${(pointsBalance / 100).toFixed(2)})
              </button>
              {usePoints && <span className="text-[#1B4332]">−${pointsValue.toFixed(2)}</span>}
            </div>
          )}
          <div className="flex justify-between font-bold text-[#1A1A1A] pt-2 border-t border-gray-200">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <p className="text-xs text-[#6B7770]">+{pointsEarned} Fairway Points earned</p>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* TODO: Replace with Stripe Checkout when payment is wired */}
      <Button
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full bg-[#1B4332] hover:bg-[#1B4332]/90 text-[#FAF7F2] font-semibold py-6"
      >
        {isPending ? 'Confirming...' : `Confirm Booking · $${total.toFixed(2)}`}
      </Button>
      <p className="text-xs text-center text-[#6B7770]">Free cancellation up to 1 hour before tee time</p>
    </div>
  )
}
