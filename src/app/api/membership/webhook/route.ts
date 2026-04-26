import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = createAdminClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    if (session.mode !== 'subscription') return NextResponse.json({ ok: true })

    const userId = session.metadata?.user_id
    const tier = session.metadata?.tier
    if (!userId || !tier) return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })

    const sub = session.subscription as string
    const stripeSubscription = await stripe.subscriptions.retrieve(sub) as any
    const periodEnd = new Date(stripeSubscription.current_period_end * 1000).toISOString()

    await admin.from('memberships').upsert({
      user_id: userId,
      tier,
      status: 'active',
      stripe_subscription_id: sub,
      current_period_end: periodEnd,
    }, { onConflict: 'user_id' })
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const userId = sub.metadata?.user_id
    if (!userId) return NextResponse.json({ ok: true })

    await admin.from('memberships')
      .update({ status: 'canceled' })
      .eq('stripe_subscription_id', sub.id)
  }

  return NextResponse.json({ ok: true })
}
