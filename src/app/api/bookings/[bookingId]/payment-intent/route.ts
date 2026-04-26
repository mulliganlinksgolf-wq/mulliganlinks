import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'
import { platformFeeCents } from '@/lib/stripe/fees'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const { data: booking } = await admin
    .from('bookings')
    .select(`
      id, user_id, players, green_fee_cents, status, stripe_payment_intent_id,
      tee_times(scheduled_at, course_id,
        courses(id, name, stripe_account_id, stripe_charges_enabled, absorb_stripe_fees)
      )
    `)
    .eq('id', bookingId)
    .single()

  if (!booking || booking.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (booking.status !== 'pending_payment') {
    return NextResponse.json({ error: 'Booking is not awaiting payment' }, { status: 400 })
  }

  const course = (booking.tee_times as any)?.courses
  if (!course?.stripe_charges_enabled) {
    return NextResponse.json({ error: 'Course is not set up to accept payments' }, { status: 400 })
  }

  // Reuse existing PaymentIntent if we already created one
  if (booking.stripe_payment_intent_id) {
    const existing = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id)
    if (existing.status === 'requires_payment_method' || existing.status === 'requires_confirmation') {
      return NextResponse.json({ client_secret: existing.client_secret })
    }
  }

  // Get golfer membership tier
  const { data: membership } = await admin
    .from('memberships')
    .select('tier')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  const tier = membership?.tier ?? 'free'
  const greenFeeCents = booking.green_fee_cents!
  const appFeeCents = platformFeeCents(tier)
  const totalCents = greenFeeCents + appFeeCents

  const teeTime = booking.tee_times as any
  const teeTimeDate = new Date(teeTime.scheduled_at).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/Detroit',
  })

  const pi = await stripe.paymentIntents.create({
    amount: totalCents,
    currency: 'usd',
    application_fee_amount: appFeeCents,
    transfer_data: { destination: course.stripe_account_id },
    setup_future_usage: 'off_session', // saves card for no-show charges
    metadata: {
      booking_id: bookingId,
      course_id: course.id,
      golfer_id: user.id,
      member_tier: tier,
      booking_type: 'tee_time',
    },
    description: `Tee time at ${course.name} — ${teeTimeDate}`,
    statement_descriptor_suffix: course.name.substring(0, 22),
  })

  // Persist PI ID and amounts
  await admin
    .from('bookings')
    .update({
      stripe_payment_intent_id: pi.id,
      green_fee_cents: greenFeeCents,
      platform_fee_cents: appFeeCents,
      total_charged_cents: totalCents,
      payment_status: 'processing',
    })
    .eq('id', bookingId)

  return NextResponse.json({ client_secret: pi.client_secret })
}
