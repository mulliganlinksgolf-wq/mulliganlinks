import { NextResponse } from 'next/server'

// TODO: Replace with Stripe checkout session creation when API keys are provided
// stripe.checkout.sessions.create({ mode: 'subscription', line_items: [{ price: PRICE_ID, quantity: 1 }], ... })
export async function POST() {
  return NextResponse.redirect(new URL('/app/membership?payment=soon', process.env.NEXT_PUBLIC_APP_URL!))
}
