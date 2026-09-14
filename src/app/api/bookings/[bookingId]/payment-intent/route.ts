import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'

type BookingCourse = {
  id: string; name: string; stripe_account_id: string | null; stripe_charges_enabled: boolean;
}
type BookingTeeTime = { scheduled_at: string; courses: BookingCourse | BookingCourse[] | null }

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const { data: booking, error: bookingError } = await admin
    .from('bookings')
    .select(`
      id, user_id, players, green_fee_cents, platform_fee_cents, total_charged_cents, discount_cents, cart_fee_cents, points_awarded, status, stripe_payment_intent_id, cancellation_requested_at, reservation_expires_at,
      tee_times(scheduled_at, course_id,
        courses(id, name, stripe_account_id, stripe_charges_enabled, absorb_stripe_fees)
      )
    `)
    .eq('id', bookingId)
    .single()

  if (bookingError) return NextResponse.json({ error: 'Could not load booking' }, { status: 500 })
  if (!booking || booking.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (booking.cancellation_requested_at || (booking.reservation_expires_at && new Date(booking.reservation_expires_at) <= new Date())) {
    return NextResponse.json({ error: 'This reservation has expired or is being canceled. Choose a new tee time.' }, { status: 409 })
  }
  if (booking.status !== 'pending_payment') {
    return NextResponse.json({ error: 'Booking is not awaiting payment' }, { status: 400 })
  }

  const teeTimes = booking.tee_times as unknown as BookingTeeTime | BookingTeeTime[] | null
  const teeTime = Array.isArray(teeTimes) ? teeTimes[0] : teeTimes
  const course = Array.isArray(teeTime?.courses) ? teeTime.courses[0] : teeTime?.courses
  if (!course?.stripe_charges_enabled || !course.stripe_account_id) {
    return NextResponse.json({ error: 'Course is not set up to accept payments' }, { status: 400 })
  }

  try {
    // Reuse the same PaymentIntent after network errors or authentication steps.
    if (booking.stripe_payment_intent_id) {
      const existing = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id)
      if (existing.amount !== booking.total_charged_cents || existing.metadata.booking_id !== bookingId) {
        return NextResponse.json({ error: 'Payment does not match booking. Please contact support.' }, { status: 409 })
      }
      if (['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(existing.status)) {
        return NextResponse.json({ client_secret: existing.client_secret })
      }
      return NextResponse.json({ error: 'Payment is already processing or closed. Check your booking before retrying.' }, { status: 409 })
    }

    // Amounts were computed on the server and persisted atomically with the booking.
    const greenFeeCents = booking.green_fee_cents!
    const appFeeCents = booking.platform_fee_cents
    const totalCents = booking.total_charged_cents
    if (!Number.isSafeInteger(totalCents) || totalCents < 50) {
      return NextResponse.json({ error: 'Invalid booking total' }, { status: 400 })
    }

    const teeTimeDate = new Date(teeTime!.scheduled_at).toLocaleDateString('en-US', {
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
        booking_type: 'tee_time',
      },
      description: `Tee time at ${course.name}, ${teeTimeDate}`,
      statement_descriptor_suffix: course.name.substring(0, 22),
    }, { idempotencyKey: `booking-payment-${bookingId}` })

    // Persist PI ID and amounts
    const { data: saved, error: saveError } = await admin
      .from('bookings')
      .update({
        stripe_payment_intent_id: pi.id,
        green_fee_cents: greenFeeCents,
        platform_fee_cents: appFeeCents,
        total_charged_cents: totalCents,
        payment_status: 'processing',
      })
      .eq('id', bookingId).eq('status', 'pending_payment').is('cancellation_requested_at', null)
      .select('id').maybeSingle()

    if (!saved && !saveError) {
      await stripe.paymentIntents.cancel(pi.id).catch(() => {})
      return NextResponse.json({ error: 'Reservation closed. Choose a new tee time.' }, { status: 409 })
    }
    if (saveError) return NextResponse.json({ error: 'Could not save payment. Please retry.' }, { status: 500 })
    return NextResponse.json({ client_secret: pi.client_secret })
  } catch {
    return NextResponse.json({ error: 'Payment is temporarily unavailable. Please retry.' }, { status: 502 })
  }
}
