import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { handleMembershipEvent } from '@/lib/membership-sync'
import type Stripe from 'stripe'
export async function POST(req: NextRequest) {
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(await req.text(), req.headers.get('stripe-signature') ?? '', process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }
  try {
    await handleMembershipEvent(event, createAdminClient())
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Membership sync failed; retry required' }, { status: 500 })
  }
}
