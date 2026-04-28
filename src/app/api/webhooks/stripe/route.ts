import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendBookingConfirmation, sendCourseBookingAlert } from '@/lib/emails'
import { deriveAccountStatus } from '@/lib/stripe/fees'
import Stripe from 'stripe'

// App Router: raw body via req.text()
export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret || webhookSecret.includes('placeholder')) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Idempotency: skip if we've already processed this event
  const { error: insertError } = await admin
    .from('stripe_webhook_events')
    .insert({
      stripe_event_id: event.id,
      event_type: event.type,
      payload: event as any,
    })

  if (insertError?.code === '23505') {
    // Duplicate — already processed
    return NextResponse.json({ received: true, duplicate: true })
  }

  try {
    await handleEvent(event, admin)
    await admin
      .from('stripe_webhook_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('stripe_event_id', event.id)
  } catch (err) {
    await admin
      .from('stripe_webhook_events')
      .update({ processing_error: String(err) })
      .eq('stripe_event_id', event.id)
    // Still return 200 so Stripe doesn't retry — error is logged in DB
  }

  return NextResponse.json({ received: true })
}

async function handleEvent(event: Stripe.Event, admin: ReturnType<typeof createAdminClient>) {
  switch (event.type) {
    case 'payment_intent.succeeded':
      await onPaymentSucceeded(event.data.object as Stripe.PaymentIntent, admin)
      break

    case 'payment_intent.payment_failed':
      await onPaymentFailed(event.data.object as Stripe.PaymentIntent, admin)
      break

    case 'charge.refunded':
      await onChargeRefunded(event.data.object as Stripe.Charge, admin)
      break

    case 'charge.dispute.created':
      await onDisputeCreated(event.data.object as Stripe.Dispute, admin)
      break

    case 'charge.dispute.closed':
      await onDisputeClosed(event.data.object as Stripe.Dispute, admin)
      break

    case 'account.updated':
      await onAccountUpdated(event.data.object as Stripe.Account, admin)
      break

    case 'account.application.deauthorized':
      await onAccountDeauthorized(event.data.object as any, admin)
      break

    case 'payout.paid':
    case 'payout.failed':
      await onPayout(event.data.object as Stripe.Payout, event.type, admin)
      break

    // Membership subscription events
    case 'checkout.session.completed':
      await onCheckoutCompleted(event.data.object as Stripe.Checkout.Session, admin)
      break

    case 'customer.subscription.deleted':
      await onSubscriptionDeleted(event.data.object as Stripe.Subscription, admin)
      break
  }
}

async function onPaymentSucceeded(pi: Stripe.PaymentIntent, admin: ReturnType<typeof createAdminClient>) {
  const bookingId = pi.metadata?.booking_id
  if (!bookingId) return

  const { data: booking } = await admin
    .from('bookings')
    .select('id, user_id, tee_time_id, players, platform_fee_cents, total_charged_cents, points_awarded, tee_times(scheduled_at, course_id, courses(id, name, slug))')
    .eq('id', bookingId)
    .single()

  if (!booking || (booking as any).payment_status === 'succeeded') return

  const tier = pi.metadata?.member_tier ?? 'free'
  const MULTIPLIER: Record<string, number> = { free: 1, fairway: 1, eagle: 1.5, ace: 2 }
  const multiplier = MULTIPLIER[tier] ?? 1
  const greenFeeCents = (booking.total_charged_cents ?? 0) - (booking.platform_fee_cents ?? 0)
  const pointsEarned = Math.floor((greenFeeCents / 100) * multiplier)

  await admin
    .from('bookings')
    .update({
      status: 'confirmed',
      payment_status: 'succeeded',
      paid_at: new Date().toISOString(),
      stripe_charge_id: pi.latest_charge as string ?? null,
      points_awarded: pointsEarned,
    })
    .eq('id', bookingId)

  // Decrement tee time availability
  const { data: teeTime } = await admin
    .from('tee_times')
    .select('available_players')
    .eq('id', booking.tee_time_id)
    .single()

  if (teeTime) {
    const remaining = teeTime.available_players - booking.players
    await admin
      .from('tee_times')
      .update({ available_players: remaining, status: remaining <= 0 ? 'booked' : 'open' })
      .eq('id', booking.tee_time_id)
  }

  // Award Fairway Points
  if (pointsEarned > 0) {
    const course = (booking.tee_times as any)?.courses
    await admin.from('fairway_points').insert({
      user_id: booking.user_id,
      course_id: course?.id,
      booking_id: bookingId,
      amount: pointsEarned,
      reason: `Booking (${tier} rate, ${multiplier}×)`,
    })
  }

  // Send emails fire-and-forget
  const course = (booking.tee_times as any)?.courses
  const teeTimeIso = (booking.tee_times as any)?.scheduled_at ?? ''
  const total = (booking.total_charged_cents ?? 0) / 100

  const { data: member } = await admin
    .from('profiles')
    .select('full_name, email')
    .eq('id', booking.user_id)
    .single()

  sendBookingConfirmation({
    userId: booking.user_id,
    bookingId,
    teeTimeId: booking.tee_time_id,
    players: booking.players,
    total,
    pointsEarned,
  }).catch(() => {})

  if (course && member) {
    sendCourseBookingAlert({
      courseId: course.id,
      courseSlug: course.slug ?? '',
      memberName: member.full_name ?? 'Member',
      memberEmail: member.email ?? '',
      players: booking.players,
      total,
      teeTimeIso,
      courseName: course.name,
    }).catch(() => {})
  }
}

async function onPaymentFailed(pi: Stripe.PaymentIntent, admin: ReturnType<typeof createAdminClient>) {
  const bookingId = pi.metadata?.booking_id
  if (!bookingId) return

  await admin
    .from('bookings')
    .update({ payment_status: 'failed' })
    .eq('id', bookingId)
}

async function onChargeRefunded(charge: Stripe.Charge, admin: ReturnType<typeof createAdminClient>) {
  const pi = charge.payment_intent as string
  if (!pi) return

  const { data: booking } = await admin
    .from('bookings')
    .select('id')
    .eq('stripe_payment_intent_id', pi)
    .maybeSingle()

  if (!booking) return

  const refundedTotal = charge.amount_refunded
  const isFullRefund = charge.refunded

  await admin
    .from('bookings')
    .update({
      payment_status: isFullRefund ? 'refunded' : 'partially_refunded',
      refunded_amount_cents: refundedTotal,
    })
    .eq('id', booking.id)
}

async function onDisputeCreated(dispute: Stripe.Dispute, admin: ReturnType<typeof createAdminClient>) {
  const charge = await stripe.charges.retrieve(dispute.charge as string)
  const pi = charge.payment_intent as string
  if (!pi) return

  const { data: booking } = await admin
    .from('bookings')
    .select('id, tee_time_id, tee_times(course_id)')
    .eq('stripe_payment_intent_id', pi)
    .maybeSingle()

  if (!booking) return

  const courseId = (booking.tee_times as any)?.course_id
  if (!courseId) return

  await admin.from('payment_disputes').insert({
    booking_id: booking.id,
    course_id: courseId,
    stripe_dispute_id: dispute.id,
    amount_cents: dispute.amount,
    reason: dispute.reason,
    status: dispute.status,
    evidence_due_by: dispute.evidence_details?.due_by
      ? new Date(dispute.evidence_details.due_by * 1000).toISOString()
      : null,
  })

  await admin.from('bookings').update({ payment_status: 'disputed' }).eq('id', booking.id)
}

async function onDisputeClosed(dispute: Stripe.Dispute, admin: ReturnType<typeof createAdminClient>) {
  await admin
    .from('payment_disputes')
    .update({
      status: dispute.status,
      outcome: dispute.status === 'won' ? 'won' : 'lost',
      resolved_at: new Date().toISOString(),
    })
    .eq('stripe_dispute_id', dispute.id)
}

async function onAccountUpdated(account: Stripe.Account, admin: ReturnType<typeof createAdminClient>) {
  const courseId = account.metadata?.course_id
  if (!courseId) return

  await admin
    .from('courses')
    .update({
      stripe_charges_enabled: account.charges_enabled,
      stripe_payouts_enabled: account.payouts_enabled,
      stripe_details_submitted: account.details_submitted,
      stripe_account_status: deriveAccountStatus(account),
    })
    .eq('id', courseId)
}

async function onAccountDeauthorized(data: any, admin: ReturnType<typeof createAdminClient>) {
  const accountId = data.account ?? data.id
  if (!accountId) return

  await admin
    .from('courses')
    .update({ stripe_account_status: 'disabled', stripe_charges_enabled: false })
    .eq('stripe_account_id', accountId)
}

async function onPayout(payout: Stripe.Payout, eventType: string, admin: ReturnType<typeof createAdminClient>) {
  // Payout events come from connected accounts — account ID in event
  // We need the account ID to look up the course. It's in the event account field, but here we use metadata.
  // The account ID comes from the event's `account` field which isn't on the payout object directly.
  // For now, store by payout ID and update course later via account.updated.

  const { data: course } = await admin
    .from('courses')
    .select('id')
    .eq('stripe_account_id', (payout as any).destination ?? '')
    .maybeSingle()

  if (!course) return

  await admin.from('course_payouts').upsert({
    course_id: course.id,
    stripe_payout_id: payout.id,
    amount_cents: payout.amount,
    arrival_date: new Date(payout.arrival_date * 1000).toISOString().split('T')[0],
    status: payout.status,
  }, { onConflict: 'stripe_payout_id' })
}

async function onCheckoutCompleted(session: Stripe.Checkout.Session, admin: ReturnType<typeof createAdminClient>) {
  if (session.mode !== 'subscription') return

  const userId = session.metadata?.user_id
  const tier = session.metadata?.tier
  if (!userId || !tier) return

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

async function onSubscriptionDeleted(sub: Stripe.Subscription, admin: ReturnType<typeof createAdminClient>) {
  const userId = sub.metadata?.user_id
  if (!userId) return

  await admin
    .from('memberships')
    .update({ status: 'canceled' })
    .eq('stripe_subscription_id', sub.id)
}
