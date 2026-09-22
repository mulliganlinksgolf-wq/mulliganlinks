import { courseBillingEnabled } from '@/lib/course-billing/access'
import { handleCourseBillingEvent } from '@/lib/course-billing/stripe'
import { related } from '@/lib/supabase/related'
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendBookingConfirmation, sendCourseBookingAlert } from '@/lib/emails'
import { deriveAccountStatus } from '@/lib/stripe/fees'
import Stripe from 'stripe'
import { handleMembershipEvent } from '@/lib/membership-sync'

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
      payload: event,
    })

  if (insertError) {
    if (insertError.code !== '23505') return NextResponse.json({ error: 'Could not record event' }, { status: 500 })
    const { data: prior, error } = await admin.from('stripe_webhook_events')
      .select('processed').eq('stripe_event_id', event.id).single()
    if (error) return NextResponse.json({ error: 'Could not load event' }, { status: 500 })
    if (prior?.processed) return NextResponse.json({ received: true, duplicate: true })
  }

  try {
    await handleEvent(event, admin)
    await admin
      .from('stripe_webhook_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('stripe_event_id', event.id).throwOnError()
  } catch (err) {
    await admin
      .from('stripe_webhook_events')
      .update({ processing_error: String(err) })
      .eq('stripe_event_id', event.id)
    return NextResponse.json({ error: 'Event processing failed; retry required' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handleEvent(event: Stripe.Event, admin: ReturnType<typeof createAdminClient>) {
  if (courseBillingEnabled()) await handleCourseBillingEvent(event, admin)
  await handleMembershipEvent(event, admin)
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
      await onAccountDeauthorized(event.account, admin)
      break

    case 'payout.paid':
    case 'payout.failed':
      await onPayout(event.data.object as Stripe.Payout, event.type, admin)
      break


  }
}

async function onPaymentSucceeded(pi: Stripe.PaymentIntent, admin: ReturnType<typeof createAdminClient>) {
  const bookingId = pi.metadata?.booking_id
  if (!bookingId) return

  const { data: booking } = await admin
    .from('bookings')
    .select('id, user_id, tee_time_id, players, platform_fee_cents, total_charged_cents, points_awarded, payment_status, tee_times(scheduled_at, course_id, courses(id, name, slug))')
    .eq('id', bookingId)
    .single()

  if (!booking) throw new Error('Booking not found for payment')
  const { data: settled, error } = await admin.rpc('settle_booking_payment', {
    p_booking_id: bookingId, p_payment_intent_id: pi.id,
    p_charge_id: typeof pi.latest_charge === 'string' ? pi.latest_charge : pi.latest_charge?.id ?? null,
    p_amount: pi.amount_received,
  })
  if (error) throw error
  if (!settled) return
  const pointsEarned = booking.points_awarded ?? 0

  // Send emails fire-and-forget
  const course = related((booking.tee_times))?.courses
  const teeTimeIso = related((booking.tee_times))?.scheduled_at ?? ''
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
      courseId: related(course)!.id,
      courseSlug: related(course)!.slug ?? '',
      memberName: member.full_name ?? 'Member',
      memberEmail: member.email ?? '',
      players: booking.players,
      total,
      teeTimeIso,
      courseName: related(course)!.name,
    }).catch(() => {})
  }
}

async function onPaymentFailed(pi: Stripe.PaymentIntent, admin: ReturnType<typeof createAdminClient>) {
  const bookingId = pi.metadata?.booking_id
  if (!bookingId) return

  await admin
    .from('bookings')
    .update({ payment_status: 'failed' })
    .eq('id', bookingId).eq('stripe_payment_intent_id', pi.id).eq('status', 'pending_payment').throwOnError()
}

async function onChargeRefunded(charge: Stripe.Charge, admin: ReturnType<typeof createAdminClient>) {
  const pi = charge.payment_intent as string
  if (!pi) return

  const { data: booking } = await admin
    .from('bookings')
    .select('id')
    .eq('stripe_payment_intent_id', pi)
    .maybeSingle().throwOnError()

  if (!booking) return

  const refundedTotal = charge.amount_refunded
  const isFullRefund = charge.refunded

  await admin
    .from('bookings')
    .update({
      payment_status: isFullRefund ? 'refunded' : 'partially_refunded',
      refunded_amount_cents: refundedTotal,
    })
    .eq('id', booking.id).throwOnError()
}

async function onDisputeCreated(dispute: Stripe.Dispute, admin: ReturnType<typeof createAdminClient>) {
  const charge = await stripe.charges.retrieve(dispute.charge as string)
  const pi = charge.payment_intent as string
  if (!pi) return

  const { data: booking } = await admin
    .from('bookings')
    .select('id, tee_time_id, tee_times(course_id)')
    .eq('stripe_payment_intent_id', pi)
    .maybeSingle().throwOnError()

  if (!booking) return

  const courseId = related((booking.tee_times))?.course_id
  if (!courseId) return

  await admin.from('payment_disputes').upsert({
    booking_id: booking.id,
    course_id: courseId,
    stripe_dispute_id: dispute.id,
    amount_cents: dispute.amount,
    reason: dispute.reason,
    status: dispute.status,
    evidence_due_by: dispute.evidence_details?.due_by
      ? new Date(dispute.evidence_details.due_by * 1000).toISOString()
      : null,
  }, { onConflict: 'stripe_dispute_id' }).throwOnError()

  await admin.from('bookings').update({ payment_status: 'disputed' }).eq('id', booking.id).throwOnError()
}

async function onDisputeClosed(dispute: Stripe.Dispute, admin: ReturnType<typeof createAdminClient>) {
  await admin
    .from('payment_disputes')
    .update({
      status: dispute.status,
      outcome: dispute.status === 'won' ? 'won' : 'lost',
      resolved_at: new Date().toISOString(),
    })
    .eq('stripe_dispute_id', dispute.id).throwOnError()
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
    .eq('id', courseId).throwOnError()
}

async function onAccountDeauthorized(accountId: string | undefined, admin: ReturnType<typeof createAdminClient>) {
  if (!accountId) return

  await admin
    .from('courses')
    .update({ stripe_account_status: 'disabled', stripe_charges_enabled: false })
    .eq('stripe_account_id', accountId).throwOnError()
}

async function onPayout(payout: Stripe.Payout, eventType: string, admin: ReturnType<typeof createAdminClient>) {
  // Payout events come from connected accounts, account ID in event
  // We need the account ID to look up the course. It's in the event account field, but here we use metadata.
  // The account ID comes from the event's `account` field which isn't on the payout object directly.
  // For now, store by payout ID and update course later via account.updated.

  const { data: course } = await admin
    .from('courses')
    .select('id')
    .eq('stripe_account_id', (payout).destination ?? '')
    .maybeSingle().throwOnError()

  if (!course) return

  await admin.from('course_payouts').upsert({
    course_id: course.id,
    stripe_payout_id: payout.id,
    amount_cents: payout.amount,
    arrival_date: new Date(payout.arrival_date * 1000).toISOString().split('T')[0],
    status: payout.status,
  }, { onConflict: 'stripe_payout_id' }).throwOnError()
}
