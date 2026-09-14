import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'

export async function cancelReservation(bookingId: string, userId: string | null, reason: 'member' | 'expired') {
  const admin = createAdminClient()
  const { data: booking, error } = await admin.rpc('request_booking_cancellation', {
    p_booking_id: bookingId, p_user_id: userId, p_reason: reason,
  })
  if (error) throw new Error(error.message)
  if (!booking) throw new Error('Booking not found')
  if (booking.status === 'canceled') return { changed: false, refundedCents: booking.refunded_amount_cents ?? 0 }
  let refundedCents = 0
  if (booking.stripe_payment_intent_id) {
    let intent = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id)
    if (intent.metadata.booking_id !== bookingId || intent.amount !== booking.total_charged_cents) {
      throw new Error('Payment does not match this booking. Please contact support.')
    }
    if (intent.status !== 'succeeded' && intent.status !== 'canceled') {
      try {
        intent = await stripe.paymentIntents.cancel(intent.id, {
          cancellation_reason: booking.cancellation_reason === 'expired' ? 'abandoned' : 'requested_by_customer',
        }, { idempotencyKey: `booking-cancel-intent-${bookingId}` })
      } catch {
        // The golfer may have finished paying while cancellation was requested.
        intent = await stripe.paymentIntents.retrieve(intent.id)
      }
    }
    if (intent.status === 'succeeded') {
      if (booking.cancellation_reason === 'expired') {
        // A completed payment wins over an abandoned-checkout sweep.
        const { error: settleError } = await admin.rpc('settle_booking_payment', {
          p_booking_id: bookingId, p_payment_intent_id: intent.id,
          p_charge_id: typeof intent.latest_charge === 'string' ? intent.latest_charge : intent.latest_charge?.id ?? null,
          p_amount: intent.amount_received,
        })
        if (settleError) throw new Error(settleError.message)
        return { changed: false, refundedCents: 0 }
      }
      const chargeId = typeof intent.latest_charge === 'string' ? intent.latest_charge : intent.latest_charge?.id
      if (!chargeId) throw new Error('Payment is still processing. Please retry shortly.')
      let charge = await stripe.charges.retrieve(chargeId)
      if (!charge.refunded) {
        const refund = await stripe.refunds.create({
          payment_intent: intent.id, reason: 'requested_by_customer',
          ...(intent.transfer_data?.destination ? { reverse_transfer: true } : {}),
          ...(intent.application_fee_amount ? { refund_application_fee: true } : {}),
        }, { idempotencyKey: `booking-cancel-refund-${bookingId}` })
        const current = await stripe.refunds.retrieve(refund.id)
        if (current.status !== 'succeeded') throw new Error('Your cancellation is saved. The refund is still processing; please check back shortly.')
        charge = await stripe.charges.retrieve(chargeId)
      }
      if (!charge.refunded) throw new Error('Refund is not complete. Your cancellation will be retried.')
      refundedCents = charge.amount_refunded
    } else if (intent.status !== 'canceled') {
      throw new Error('Payment is still processing. Your cancellation is saved and will be retried.')
    }
  }
  const { data: changed, error: finishError } = await admin.rpc('finish_booking_cancellation', {
    p_booking_id: bookingId, p_refunded_cents: refundedCents,
  })
  if (finishError) throw new Error('Your cancellation is saved but could not finish. Please retry shortly.')
  return { changed: Boolean(changed), refundedCents }
}

/** Inventory reads clean expired reservations; the daily cron is a backstop. */
export async function reconcileReservations(courseId?: string) {
  const admin = createAdminClient()
  let query = admin.from('bookings').select('id,user_id')
    .in('status', ['pending_payment', 'confirmed'])
    .or(`and(status.eq.pending_payment,reservation_expires_at.lte.${new Date().toISOString()}),cancellation_requested_at.not.is.null`)
    .order('created_at').limit(25)
  if (courseId) query = query.eq('course_id', courseId)
  const { data, error } = await query
  if (error) throw new Error('Could not reconcile booking availability')
  let completed = 0
  let failed = 0
  for (const booking of data ?? []) {
    try {
      const result = await cancelReservation(booking.id, booking.user_id, 'expired')
      if (result.changed) completed++
    } catch {
      failed++
      console.error('[booking-reconciliation] Reservation needs another attempt', booking.id)
    }
  }
  return { checked: data?.length ?? 0, completed, failed }
}
