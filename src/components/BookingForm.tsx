'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { confirmBooking } from '@/app/actions/booking'
import { lookupRainCheck } from '@/app/actions/rainCheck'
import CartSelector from '@/components/CartSelector'

interface TeeTime {
  id: string
  scheduled_at: string
  available_players: number
  base_price: number
  courses: { id: string; name: string; slug: string }
}

const MULTIPLIER: Record<string, number> = { free: 1, fairway: 1, eagle: 1.5, ace: 2 }

export function BookingForm({
  teeTime,
  tier,
  pointsBalance,
  creditBalanceCents = 0,
  userId,
  availablePasses = [],
  compRoundsRemaining = 0,
  compRoundsResetAt,
  pointsThreshold = 5000,
  cartPolicy = 'optional',
  cartFeeCents = 0,
}: {
  teeTime: TeeTime
  tier: string
  pointsBalance: number
  creditBalanceCents?: number
  userId: string
  availablePasses?: { id: string; expires_at: string }[]
  compRoundsRemaining?: number
  compRoundsResetAt?: string | null
  pointsThreshold?: number
  cartPolicy?: 'optional' | 'mandatory' | 'walking_only'
  cartFeeCents?: number
}) {
  const [players, setPlayers] = useState(1)
  const [usePoints, setUsePoints] = useState(false)
  const [useCredits, setUseCredits] = useState(false)
  const [useGuestPass, setUseGuestPass] = useState(false)
  const [rainCheckCode, setRainCheckCode] = useState('')
  const [rainCheck, setRainCheck] = useState<{ id: string; amountCents: number } | null>(null)
  const [rainCheckError, setRainCheckError] = useState<string | null>(null)
  const [useCompRound, setUseCompRound] = useState(false)
  const [useFreeRound, setUseFreeRound] = useState(false)
  const [cartSelected, setCartSelected] = useState(cartPolicy === 'mandatory')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function handleCompRoundToggle(checked: boolean) {
    setUseCompRound(checked)
    if (checked) { setUseFreeRound(false); setUsePoints(false) }
  }

  function handleFreeRoundToggle(checked: boolean) {
    setUseFreeRound(checked)
    if (checked) { setUseCompRound(false); setUsePoints(false); setUseGuestPass(false) }
  }

  const multiplier = MULTIPLIER[tier] ?? 1
  const subtotal = teeTime.base_price * players
  const greenFeeCents = Math.round(teeTime.base_price * players * 100)

  // Comp/free round covers the member's own green fee (1 player) — others still pay
  const memberFeeDiscount = (useCompRound || useFreeRound) ? teeTime.base_price : 0
  const guestDiscount = useGuestPass ? 15 : 0
  const cartFeeAdded = (cartSelected && cartPolicy !== 'walking_only') ? cartFeeCents / 100 : 0
  const afterFreeDiscounts = subtotal - memberFeeDiscount - guestDiscount + cartFeeAdded
  const creditsValue = useCredits
    ? Math.min(creditBalanceCents / 100, afterFreeDiscounts)
    : 0
  const afterCredits = afterFreeDiscounts - creditsValue
  const rainCheckValue = rainCheck
    ? Math.min(rainCheck.amountCents / 100, afterCredits)
    : 0
  const afterRainCheck = afterCredits - rainCheckValue
  const pointsValue = usePoints && !useFreeRound
    ? Math.min(pointsBalance / 100, afterRainCheck)
    : 0

  const total = Math.max(0, afterRainCheck - pointsValue)
  const pointsEarned = useCompRound ? 0 : Math.floor(total * multiplier)
  const pointsRedeemed = useFreeRound
    ? pointsThreshold
    : usePoints
      ? Math.round(pointsValue * 100)
      : 0

  function handleSubmit() {
    setError(null)
    startTransition(async () => {
      const result = await (confirmBooking as any)({
        teeTimeId: teeTime.id,
        userId,
        players,
        subtotal,
        discount: 0,
        pointsRedeemed,
        creditsRedeemedCents: useCredits ? Math.round(creditsValue * 100) : 0,
        rainCheckId: rainCheck?.id,
        total,
        pointsEarned,
        tier,
        guestPassId: useGuestPass && availablePasses[0] ? availablePasses[0].id : undefined,
        redemptionType: useCompRound ? 'complimentary' : useFreeRound ? 'points' : undefined,
        // cart fields — action updated in Task 8
        cartSelected: cartSelected,
        cartFeeCents: cartSelected ? cartFeeCents : 0,
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
                onClick={() => { setPlayers(n); if (n <= 1) setUseGuestPass(false) }}
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

      {/* Walk or Ride? */}
      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="pt-5 pb-5">
          <p className="text-sm font-medium text-[#1A1A1A] mb-3">Walk or ride?</p>
          <CartSelector
            greenFeeCents={greenFeeCents}
            cartFeeCents={cartFeeCents}
            cartPolicy={cartPolicy}
            value={cartSelected}
            onChange={setCartSelected}
          />
        </CardContent>
      </Card>

      {/* Price breakdown */}
      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="pt-5 pb-5 space-y-2 text-sm">
          <div className="flex justify-between text-[#6B7770]">
            <span>${teeTime.base_price.toFixed(2)} × {players} player{players !== 1 ? 's' : ''}</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {availablePasses.length > 0 && players > 1 && (
            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
              <button
                onClick={() => setUseGuestPass(v => !v)}
                className="flex items-center gap-2 text-[#6B7770] hover:text-[#1A1A1A]"
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${useGuestPass ? 'bg-[#1B4332] border-[#1B4332]' : 'border-gray-300'}`}>
                  {useGuestPass && <span className="text-white text-xs">✓</span>}
                </div>
                Use a guest pass — save $15 ({availablePasses.length} remaining)
              </button>
              {useGuestPass && <span className="text-[#1B4332] font-medium">−$15.00</span>}
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

          {/* Complimentary round toggle — Eagle/Ace only */}
          {compRoundsRemaining > 0 && (
            <div className="flex items-center justify-between py-2 border-b border-[#e5e7eb]">
              <div>
                <p className="text-sm font-medium text-[#1A1A1A]">Use complimentary round</p>
                <p className="text-[11px] text-[#6B7770]">
                  {compRoundsRemaining} remaining · covers your green fee
                  {compRoundsResetAt && ` · resets ${new Date(compRoundsResetAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                </p>
              </div>
              <input
                type="checkbox"
                checked={useCompRound}
                onChange={e => handleCompRoundToggle(e.target.checked)}
                className="w-4 h-4 accent-[#1B4332]"
              />
            </div>
          )}

          {/* Free round via points */}
          {!useCompRound && pointsBalance >= pointsThreshold && (
            <div className="flex items-center justify-between py-2 border-b border-[#e5e7eb]">
              <div>
                <p className="text-sm font-medium text-[#1A1A1A]">Redeem free round</p>
                <p className="text-[11px] text-[#6B7770]">{pointsThreshold.toLocaleString()} pts · green fee covered</p>
              </div>
              <input
                type="checkbox"
                checked={useFreeRound}
                onChange={e => handleFreeRoundToggle(e.target.checked)}
                className="w-4 h-4 accent-[#1B4332]"
              />
            </div>
          )}

          {pointsBalance > 0 && (
            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
              <button
                onClick={() => {
                  const newValue = !usePoints
                  setUsePoints(newValue)
                  if (newValue) { setUseCompRound(false); setUseFreeRound(false) }
                }}
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
          {useCompRound
            ? <p className="text-xs text-[#6B7770]">No Fairway Points earned on complimentary rounds</p>
            : <p className="text-xs text-[#6B7770]">+{pointsEarned} Fairway Points earned</p>
          }
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
