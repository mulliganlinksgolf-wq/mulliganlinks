import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const { data: booking } = await admin
    .from('bookings')
    .select('id, user_id, tee_time_id, players, stripe_payment_intent_id, payment_status, tee_times(scheduled_at)')
    .eq('id', bookingId)
    .single()

  if (!booking || booking.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (booking.payment_status !== 'succeeded') {
    return NextResponse.json({ error: 'No payment to refund' }, { status: 400 })
  }

  const scheduledAt = new Date((booking.tee_times as any)?.scheduled_at)
  if (scheduledAt.getTime() - Date.now() < 60 * 60 * 1000) {
    return NextResponse.json({ error: 'Cancellations must be made at least 1 hour before tee time.' }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))

  const refund = await stripe.refunds.create({
    payment_intent: booking.stripe_payment_intent_id!,
    reverse_transfer: true,
    refund_application_fee: true,
    reason: 'requested_by_customer',
    metadata: { booking_id: bookingId, refund_reason: body.reason ?? 'customer_request' },
  })

  const { data: ttRow } = await admin
    .from('tee_times')
    .select('available_players')
    .eq('id', booking.tee_time_id)
    .single()

  await Promise.all([
    admin.from('bookings').update({
      status: 'canceled',
      payment_status: 'refunded',
      refunded_amount_cents: refund.amount,
      refund_reason: body.reason ?? 'customer_request',
      refunded_at: new Date().toISOString(),
    }).eq('id', bookingId),

    ttRow && admin.from('tee_times').update({
      available_players: ttRow.available_players + booking.players,
      status: 'open',
    }).eq('id', booking.tee_time_id),
  ])

  return NextResponse.json({ ok: true, refund_id: refund.id })
}
