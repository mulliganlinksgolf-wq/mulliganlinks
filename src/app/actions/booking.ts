'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendBookingConfirmation, sendCourseBookingAlert, sendCancellationConfirmation } from '@/lib/emails'
import { cancelReservation } from '@/lib/booking-lifecycle'
import { getBookingQuote, type BookingSelection } from '@/lib/booking-quote'

const MONTHLY_CREDIT_CENTS: Record<string, number> = { eagle: 1000, ace: 2000 }

/**
 * Issues this month's tee-time credit if it hasn't been issued yet,
 * then returns the total available credit balance in cents.
 * Safe to call on every page load, the unique index prevents duplicates.
 */
export async function getAndIssueMemberCredits(userId: string, _tier?: string): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) throw new Error('Not authorized')
  const { data: membership, error: membershipError } = await supabase.from('memberships')
    .select('tier').eq('user_id', user.id).eq('status', 'active').maybeSingle()
  if (membershipError) throw new Error('Unable to load membership')
  const amountCents = MONTHLY_CREDIT_CENTS[membership?.tier ?? 'free'] ?? 0
  const admin = createAdminClient()

  if (amountCents > 0) {
    const period = new Date().toISOString().slice(0, 7) // 'YYYY-MM'
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + 2)
    // ignoreDuplicates: true + unique index → no error on re-run
    await admin.from('member_credits').upsert(
      {
        user_id: userId,
        type: 'monthly',
        amount_cents: amountCents,
        period,
        status: 'available',
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: 'user_id,type,period', ignoreDuplicates: true },
    )
  }

  const { data: credits } = await admin
    .from('member_credits')
    .select('amount_cents')
    .eq('user_id', userId)
    .eq('status', 'available')
    .gt('expires_at', new Date().toISOString())

  return credits?.reduce((s, c) => s + c.amount_cents, 0) ?? 0
}

// Legacy display fields remain accepted during rollout, but are never trusted.
type LegacyDisplayFields = {
  userId?: string; tier?: string; subtotal?: number; discount?: number;
  total?: number; pointsEarned?: number; cartFeeCents?: number;
}

async function createBooking(input: BookingSelection & LegacyDisplayFields, online: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (input.userId && input.userId !== user.id) return { error: 'Not authorized' }
  try {
    const quote = await getBookingQuote(user.id, input, online)
    const admin = createAdminClient()
    const { data: bookingId, error } = await admin.rpc('create_member_booking', { p_quote: quote })
    if (error || !bookingId) {
      if (error?.code === '23514') return { error: 'slot_filled' }
      console.error('[createBooking]', error)
      return { error: 'Booking could not be saved. Reload to check availability and benefits.' }
    }
    if (!online) {
      sendBookingConfirmation({ userId: user.id, bookingId, teeTimeId: input.teeTimeId,
        players: input.players, total: quote.total_charged_cents / 100, pointsEarned: quote.points_awarded,
      }).catch(() => {})
      const [{ data: member }, { data: course }, { data: slot }] = await Promise.all([
        admin.from('profiles').select('full_name, email').eq('id', user.id).single(),
        admin.from('courses').select('id, name, slug').eq('id', quote.course_id).single(),
        admin.from('tee_times').select('scheduled_at').eq('id', input.teeTimeId).single(),
      ])
      if (member && course && slot) sendCourseBookingAlert({
        courseId: course.id, courseSlug: course.slug, courseName: course.name,
        memberName: member.full_name ?? 'Member', memberEmail: member.email ?? '',
        players: input.players, total: quote.total_charged_cents / 100, teeTimeIso: slot.scheduled_at,
      }).catch(() => {})
    }
    return { bookingId: String(bookingId), quote }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to create booking' }
  }
}

export async function createPendingBooking(input: BookingSelection & LegacyDisplayFields) {
  return createBooking(input, true)
}

export async function confirmBooking(input: BookingSelection & LegacyDisplayFields) {
  return createBooking(input, false)
}


export async function cancelBooking(bookingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const result = await cancelReservation(bookingId, user.id, 'member')
    if (result.changed) {
      const { data: booking } = await createAdminClient().from('bookings')
        .select('players,tee_times(scheduled_at,courses(name))').eq('id', bookingId).single()
      const slot = booking?.tee_times as unknown as { scheduled_at: string; courses: { name: string } } | null
      if (booking && slot) sendCancellationConfirmation({
        userId: user.id, courseName: slot.courses.name, teeTimeIso: slot.scheduled_at,
        players: booking.players, redeemedPointsRestored: 0,
      }).catch(() => {})
    }
    return { ok: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Cancellation could not complete. Please retry.' }
  }
}
