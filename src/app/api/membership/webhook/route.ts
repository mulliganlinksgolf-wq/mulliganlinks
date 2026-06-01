import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { issueGuestPasses } from '@/app/actions/guestPasses'
import Stripe from 'stripe'

function mapStatus(stripeStatus: string): 'active' | 'past_due' | 'canceled' {
  if (stripeStatus === 'active' || stripeStatus === 'trialing') return 'active'
  if (stripeStatus === 'past_due' || stripeStatus === 'unpaid' || stripeStatus === 'incomplete') return 'past_due'
  return 'canceled'
}

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
    const stripeSubscription = await stripe.subscriptions.retrieve(sub)
    const periodEnd = new Date(stripeSubscription.items.data[0].current_period_end * 1000).toISOString()

    const { error: upsertError } = await admin.from('memberships').upsert({
      user_id: userId,
      tier,
      status: 'active',
      stripe_subscription_id: sub,
      current_period_end: periodEnd,
    }, { onConflict: 'user_id' })

    if (upsertError) {
      console.error('[webhook] Failed to upsert membership:', upsertError)
      return NextResponse.json({ error: 'DB write failed' }, { status: 500 })
    }

    // Issue guest passes for the new membership tier
    await issueGuestPasses(userId, tier)

    // Mark founding_member permanently on the profile when payment is confirmed
    if (session.metadata?.founding_golfer === 'true') {
      const { error } = await admin.from('profiles')
        .update({ founding_member: true })
        .eq('id', userId)
      if (error) {
        console.error('[webhook] Failed to set founding_member on profile:', error)
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const userId = sub.metadata?.user_id
    if (!userId) return NextResponse.json({ ok: true })

    await admin.from('memberships')
      .update({ status: 'canceled' })
      .eq('stripe_subscription_id', sub.id)
  }

  // Native mobile flow: subscription created directly (no checkout.session). Activate
  // membership + issue guest passes. Gated on metadata.source so the web Checkout path
  // (which ALSO emits subscription.created) is not double-processed.
  if (event.type === 'customer.subscription.created') {
    const sub = event.data.object as Stripe.Subscription
    if (sub.metadata?.source === 'mobile') {
      const userId = sub.metadata?.user_id
      const tier = sub.metadata?.tier
      if (userId && tier) {
        const periodEnd = new Date(sub.items.data[0].current_period_end * 1000).toISOString()
        const { error } = await admin.from('memberships').upsert({
          user_id: userId,
          tier,
          status: mapStatus(sub.status),
          stripe_subscription_id: sub.id,
          stripe_customer_id: sub.customer as string,
          current_period_end: periodEnd,
        }, { onConflict: 'user_id' })
        if (error) {
          console.error('[webhook] mobile subscription.created upsert failed:', error)
          return NextResponse.json({ error: 'DB write failed' }, { status: 500 })
        }
        await issueGuestPasses(userId, tier)
      }
    }
  }

  // Status/period sync for any subscription (renewals, dunning). Idempotent; keyed by
  // subscription id, so the row must already exist (created by mobile created-handler or
  // web checkout.session.completed). No guest-pass side effects here.
  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription
    const periodEnd = new Date(sub.items.data[0].current_period_end * 1000).toISOString()
    await admin.from('memberships')
      .update({ status: mapStatus(sub.status), current_period_end: periodEnd })
      .eq('stripe_subscription_id', sub.id)
  }

  // Resilient subscription-id extraction: across Stripe API versions the invoice's
  // subscription pointer is either `invoice.subscription` or
  // `invoice.parent.subscription_details.subscription`. Cast to any to avoid coupling to
  // one version's typings.
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    const subId =
      ((invoice as any).subscription as string | null) ??
      ((invoice as any).parent?.subscription_details?.subscription as string | null) ??
      null
    if (subId) {
      await admin.from('memberships').update({ status: 'past_due' }).eq('stripe_subscription_id', subId)
    }
  }

  if (event.type === 'invoice.paid') {
    const invoice = event.data.object as Stripe.Invoice
    const subId =
      ((invoice as any).subscription as string | null) ??
      ((invoice as any).parent?.subscription_details?.subscription as string | null) ??
      null
    if (subId) {
      const sub = await stripe.subscriptions.retrieve(subId)
      const periodEnd = new Date(sub.items.data[0].current_period_end * 1000).toISOString()
      await admin.from('memberships')
        .update({ status: 'active', current_period_end: periodEnd })
        .eq('stripe_subscription_id', subId)
    }
  }

  return NextResponse.json({ ok: true })
}
