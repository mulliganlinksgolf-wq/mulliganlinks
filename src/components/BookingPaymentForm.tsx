'use client'

import { useState, useTransition } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Card, CardContent } from '@/components/ui/card'
import { createPendingBooking } from '@/app/actions/booking'
import { platformFeeCents } from '@/lib/stripe/fees'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const DISCOUNT: Record<string, number> = { free: 0, fairway: 0, eagle: 10, ace: 15 }
const MULTIPLIER: Record<string, number> = { free: 1, fairway: 1, eagle: 2, ace: 3 }

// Inner form rendered inside <Elements>
function CheckoutForm({
  bookingId,
  total,
  greenFee,
  appFee,
  pointsEarned,
  tier,
  discountAmt,
}: {
  bookingId: string
  total: number
  greenFee: number
  appFee: number
  pointsEarned: number
  tier: string
  discountAmt: number
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
          {discountAmt > 0 && (
            <div className="flex justify-between text-[#1B4332]">
              <span>{DISCOUNT[tier]}% member discount</span>
              <span>−${discountAmt.toFixed(2)}</span>
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
          <p className="text-xs text-[#6B7770]">+{pointsEarned} Fairway Points earned after payment</p>
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
  userId,
}: {
  teeTime: TeeTime
  tier: string
  userId: string
}) {
  const [players, setPlayers] = useState(1)
  const [step, setStep] = useState<'select' | 'pay'>('select')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const discountPct = DISCOUNT[tier] ?? 0
  const multiplier = MULTIPLIER[tier] ?? 1
  const baseSubtotal = teeTime.base_price * players
  const discount = baseSubtotal * (discountPct / 100)
  const greenFee = baseSubtotal - discount
  const appFee = platformFeeCents(tier) / 100
  const total = greenFee + appFee
  const pointsEarned = Math.floor(greenFee * multiplier)

  function handleProceed() {
    setError(null)
    startTransition(async () => {
      const result = await createPendingBooking({ teeTimeId: teeTime.id, players, tier })
      if (result.error || !result.bookingId) {
        setError(result.error ?? 'Failed to create booking')
        return
      }

      // Get PaymentIntent client secret
      const res = await fetch(`/api/bookings/${result.bookingId}/payment-intent`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.client_secret) {
        setError(data.error ?? 'Failed to initialize payment')
        return
      }

      setBookingId(result.bookingId)
      setClientSecret(data.client_secret)
      setStep('pay')
    })
  }

  if (step === 'pay' && clientSecret && bookingId) {
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
          total={total}
          greenFee={greenFee}
          appFee={platformFeeCents(tier)}
          pointsEarned={pointsEarned}
          tier={tier}
          discountAmt={discount}
        />
      </Elements>
    )
  }

  return (
    <div className="space-y-4">
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

      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="pt-5 pb-5 space-y-2 text-sm">
          <div className="flex justify-between text-[#6B7770]">
            <span>${teeTime.base_price.toFixed(2)} × {players} player{players !== 1 ? 's' : ''}</span>
            <span>${baseSubtotal.toFixed(2)}</span>
          </div>
          {discountPct > 0 && (
            <div className="flex justify-between text-[#1B4332]">
              <span>{discountPct}% member discount</span>
              <span>−${discount.toFixed(2)}</span>
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
