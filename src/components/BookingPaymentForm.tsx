'use client'

import { useState, useTransition } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Card, CardContent } from '@/components/ui/card'
import { createPendingBooking } from '@/app/actions/booking'
import CartSelector from '@/components/CartSelector'
import { platformFeeCents } from '@/lib/stripe/fees'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const MULTIPLIER: Record<string, number> = { free: 1, fairway: 1, eagle: 1.5, ace: 2 }

// Inner form rendered inside <Elements>
function CheckoutForm({
  bookingId,
  total,
  greenFee,
  appFee,
  pointsEarned,
  tier,
  guestDiscount,
  cartFee,
}: {
  bookingId: string
  total: number
  greenFee: number
  appFee: number
  pointsEarned: number
  tier: string
  guestDiscount: number
  cartFee: number
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setError(null)
    setPaying(true)

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/app/bookings/${bookingId}?confirmed=1`,
      },
    })

    // If we reach here, confirmPayment redirected for 3DS or failed
    if (stripeError) {
      setError(stripeError.message ?? 'Payment failed.')
      setPaying(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="pt-5 pb-5 space-y-2 text-sm">
          <div className="flex justify-between text-[#6B7770]">
            <span>Green fee</span>
            <span>${greenFee.toFixed(2)}</span>
          </div>
          {cartFee > 0 && <div className="flex justify-between"><span>Cart fee</span><span>${cartFee.toFixed(2)}</span></div>}
          {guestDiscount > 0 && (
            <div className="flex justify-between text-[#1B4332]">
              <span>Guest pass</span>
              <span>−${guestDiscount.toFixed(2)}</span>
            </div>
          )}
          {appFee > 0 && (
            <div className="flex justify-between text-[#6B7770]">
              <span>Booking fee</span>
              <span>${(appFee / 100).toFixed(2)}</span>
            </div>
          )}
          {appFee === 0 && tier !== 'free' && tier !== 'fairway' && (
            <div className="flex justify-between text-[#1B4332]">
              <span>Booking fee</span>
              <span>Free</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-[#1A1A1A] pt-2 border-t border-gray-200">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <p className="text-xs text-[#6B7770]">+{pointsEarned} Fairway Points earned after your round</p>
        </CardContent>
      </Card>

      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="pt-5 pb-5">
          <PaymentElement />
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={!stripe || paying}
        className="w-full rounded-lg bg-[#1B4332] py-3.5 text-sm font-semibold text-[#FAF7F2] hover:bg-[#1B4332]/90 transition-colors disabled:opacity-50"
      >
        {paying ? 'Processing...' : `Pay $${total.toFixed(2)}`}
      </button>
      <p className="text-xs text-center text-[#6B7770]">Free cancellation up to 1 hour before tee time</p>
    </form>
  )
}

interface TeeTime {
  id: string
  scheduled_at: string
  available_players: number
  base_price: number
  courses: { id: string; name: string; slug: string; stripe_charges_enabled: boolean }
}

export function BookingPaymentForm({
  teeTime,
  tier,
  availablePasses = [],
  joinExistingGroup = false,
  cartPolicy = 'optional',
  cartFeeCents = 0,
}: {
  teeTime: TeeTime
  tier: string
  userId: string
  availablePasses?: { id: string; expires_at: string }[]
  joinExistingGroup?: boolean
  cartPolicy?: 'mandatory' | 'optional' | 'walking_only'
  cartFeeCents?: number
}) {
  const [players, setPlayers] = useState(1)
  const [cartSelected, setCartSelected] = useState(cartPolicy === 'mandatory')
  const [savedQuote, setSavedQuote] = useState<{ total_charged_cents: number; green_fee_cents: number; platform_fee_cents: number; discount_cents: number; cart_fee_cents: number; points_awarded: number } | null>(null)
  const [useGuestPass, setUseGuestPass] = useState(false)
  const [step, setStep] = useState<'select' | 'pay'>('select')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const multiplier = MULTIPLIER[tier] ?? 1
  const baseSubtotal = teeTime.base_price * players
  const guestDiscount = useGuestPass ? Math.min(15, teeTime.base_price) : 0
  const appFee = platformFeeCents(tier) / 100
  const cartFee = cartSelected && cartPolicy !== 'walking_only' ? cartFeeCents / 100 : 0
  const total = baseSubtotal - guestDiscount + appFee + cartFee
  const pointsEarned = Math.floor((baseSubtotal - guestDiscount + cartFee) * multiplier)
  const selectedPass = availablePasses[0] ?? null

  function handleProceed() {
    setError(null)
    startTransition(async () => {
      const result = bookingId ? { bookingId, error: undefined } : await createPendingBooking({
        teeTimeId: teeTime.id,
        players,
        tier,
        guestPassId: useGuestPass && selectedPass ? selectedPass.id : undefined,
        joinExistingGroup,
        cartSelected,
      })
      if (result.error || !result.bookingId) {
        setError(result.error ?? 'Failed to create booking')
        return
      }

      setBookingId(result.bookingId)
      if ('quote' in result && result.quote) setSavedQuote(result.quote)
      try {
        const res = await fetch(`/api/bookings/${result.bookingId}/payment-intent`, { method: 'POST' })
        const data = await res.json()
        if (!res.ok || !data.client_secret) {
          setError(data.error ?? 'Failed to initialize payment')
          return
        }

        setBookingId(result.bookingId)
        setClientSecret(data.client_secret)
        setStep('pay')
      } catch {
        setError('Payment could not load. Please retry; your booking selection is saved.')
      }
    })
  }

  if (step === 'pay' && clientSecret && bookingId && savedQuote) {
    return (
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: 'stripe',
            variables: { colorPrimary: '#1B4332', borderRadius: '8px' },
          },
        }}
      >
        <CheckoutForm
          bookingId={bookingId}
          total={savedQuote.total_charged_cents / 100}
          greenFee={savedQuote.green_fee_cents / 100}
          appFee={savedQuote.platform_fee_cents}
          pointsEarned={savedQuote.points_awarded}
          tier={tier}
          guestDiscount={savedQuote.discount_cents / 100}
          cartFee={savedQuote.cart_fee_cents / 100}
        />
      </Elements>
    )
  }

  return (
    <div className="space-y-4">
      {!bookingId && <CartSelector cartPolicy={cartPolicy} cartFeeCents={cartFeeCents} value={cartSelected} greenFeeCents={Math.round(baseSubtotal * 100)} onChange={setCartSelected} />}
      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="pt-5 pb-5">
          <p className="text-sm font-medium text-[#1A1A1A] mb-3">Number of players</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(n => (
              <button
                key={n}
                onClick={() => { setPlayers(n); if (n <= 1) setUseGuestPass(false) }}
                disabled={!!bookingId || n > teeTime.available_players}
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

      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="pt-5 pb-5 space-y-2 text-sm">
          <div className="flex justify-between text-[#6B7770]">
            <span>${teeTime.base_price.toFixed(2)} × {players} player{players !== 1 ? 's' : ''}</span>
            <span>${baseSubtotal.toFixed(2)}</span>
          </div>
          {selectedPass && players > 1 && (
            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
              <button
                disabled={!!bookingId}
                onClick={() => setUseGuestPass(v => !v)}
                className="flex items-center gap-2 text-[#6B7770] hover:text-[#1A1A1A]"
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${useGuestPass ? 'bg-[#1B4332] border-[#1B4332]' : 'border-gray-300'}`}>
                  {useGuestPass && <span className="text-white text-xs">✓</span>}
                </div>
                Use a guest pass, save ${Math.min(15, teeTime.base_price).toFixed(2)} ({availablePasses.length} remaining)
              </button>
              {useGuestPass && <span className="text-[#1B4332] font-medium">−${guestDiscount.toFixed(2)}</span>}
            </div>
          )}
          {appFee > 0 ? (
            <div className="flex justify-between text-[#6B7770]">
              <span>Booking fee</span>
              <span>${appFee.toFixed(2)}</span>
            </div>
          ) : (
            <div className="flex justify-between text-[#1B4332]">
              <span>Booking fee</span>
              <span>Free</span>
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

      <button
        onClick={handleProceed}
        disabled={isPending}
        className="w-full rounded-lg bg-[#1B4332] py-3.5 text-sm font-semibold text-[#FAF7F2] hover:bg-[#1B4332]/90 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Loading...' : `Continue to Payment · $${total.toFixed(2)}`}
      </button>
      <p className="text-xs text-center text-[#6B7770]">Free cancellation up to 1 hour before tee time</p>
    </div>
  )
}
