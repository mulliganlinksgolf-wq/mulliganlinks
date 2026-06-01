import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserFromBearer } from '@/lib/mobile-auth'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { STRIPE_API_VERSION } from '@/lib/stripe/version'

type Tier = 'free' | 'eagle' | 'ace'

function getPriceId(tier: 'eagle' | 'ace'): string {
  return tier === 'eagle' ? process.env.STRIPE_PRICE_EAGLE! : process.env.STRIPE_PRICE_ACE!
}

export async function POST(req: NextRequest) {
  const user = await getUserFromBearer(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { tier?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const tier = body.tier as Tier
  if (tier !== 'free' && tier !== 'eagle' && tier !== 'ace') {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('memberships')
    .select('tier, status, stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle()

  // Guard: block re-subscribing if already on an active paid tier.
  if (existing && existing.status === 'active' && (existing.tier === 'eagle' || existing.tier === 'ace')) {
    return NextResponse.json({ error: 'Already an active member', tier: existing.tier }, { status: 409 })
  }

  // Ensure a free baseline membership row exists (no orphaned accounts).
  if (!existing) {
    await admin.from('memberships').insert({ user_id: user.id, tier: 'free', status: 'active' })
  }

  if (tier === 'free') {
    return NextResponse.json({ status: 'active', tier: 'free' })
  }

  // Paid: find or create the Stripe customer.
  let customerId = existing?.stripe_customer_id ?? null
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { user_id: user.id },
    })
    customerId = customer.id
    await admin.from('memberships').update({ stripe_customer_id: customerId }).eq('user_id', user.id)
  }

  const priceId = getPriceId(tier as 'eagle' | 'ace')

  // Reuse an existing incomplete subscription for this price (abandoned attempt).
  const incomplete = await stripe.subscriptions.list({ customer: customerId, status: 'incomplete', limit: 10 })
  const reusable = incomplete.data.find((s) => s.items.data.some((i) => i.price.id === priceId))

  let subscription: Stripe.Subscription
  if (reusable) {
    subscription = await stripe.subscriptions.retrieve(reusable.id, { expand: ['latest_invoice.payment_intent'] })
  } else {
    subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: { user_id: user.id, tier, source: 'mobile' },
    })
  }

  const invoice = subscription.latest_invoice as (Stripe.Invoice & { payment_intent?: Stripe.PaymentIntent }) | null
  const paymentIntent = invoice?.payment_intent
  const clientSecret = paymentIntent?.client_secret
  if (!clientSecret) {
    return NextResponse.json({ error: 'Could not initialize payment' }, { status: 500 })
  }

  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: customerId },
    { apiVersion: STRIPE_API_VERSION },
  )

  return NextResponse.json({
    paymentIntentClientSecret: clientSecret,
    ephemeralKey: ephemeralKey.secret,
    customerId,
  })
}
