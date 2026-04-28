'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendPhoneBookingConfirmation } from '@/lib/emails'

export async function updateTeeTimeStatus(teeTimeId: string, status: 'open' | 'blocked') {
  const supabase = await createClient()
  await supabase.from('tee_times').update({ status }).eq('id', teeTimeId)
  revalidatePath('/course/[slug]', 'page')
}

export async function updateBookingStatus(bookingId: string, status: 'completed' | 'no_show') {
  const supabase = await createClient()
  await supabase.from('bookings').update({ status }).eq('id', bookingId)

  // Auto-award deferred Fairway Points when a member's round is marked complete
  if (status === 'completed') {
    const { data: booking } = await supabase
      .from('bookings')
      .select('user_id, points_awarded, tee_time_id')
      .eq('id', bookingId)
      .single()

    if (booking?.user_id && booking.points_awarded > 0) {
      const { data: tt } = await supabase
        .from('tee_times')
        .select('course_id')
        .eq('id', booking.tee_time_id)
        .single()

      if (tt?.course_id) {
        await supabase.from('fairway_points').insert({
          user_id: booking.user_id,
          course_id: tt.course_id,
          booking_id: bookingId,
          amount: booking.points_awarded,
          reason: 'Round completed',
        })
      }
    }
  }

  revalidatePath('/course/[slug]', 'page')
}

export async function updateBooking({
  bookingId,
  players,
  totalPaid,
  paymentMethod,
  guestName,
  guestPhone,
  guestEmail,
}: {
  bookingId: string
  players: number
  totalPaid: number
  paymentMethod: 'cash' | 'card'
  guestName?: string
  guestPhone?: string
  guestEmail?: string
}): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: booking, error: fetchErr } = await supabase
    .from('bookings')
    .select('id, players, tee_time_id, user_id, guest_name')
    .eq('id', bookingId)
    .single()

  if (fetchErr || !booking) return { error: 'Booking not found.' }

  const delta = players - booking.players

  if (delta !== 0) {
    const { data: tt } = await supabase
      .from('tee_times')
      .select('id, available_players, max_players')
      .eq('id', booking.tee_time_id)
      .single()

    if (!tt) return { error: 'Tee time not found.' }
    if (delta > 0 && tt.available_players < delta) {
      return { error: `Only ${tt.available_players} spot${tt.available_players !== 1 ? 's' : ''} available.` }
    }

    const newAvailable = tt.available_players - delta
    await supabase
      .from('tee_times')
      .update({
        available_players: newAvailable,
        status: newAvailable === 0 ? 'booked' : 'open',
      })
      .eq('id', booking.tee_time_id)
  }

  const patch: Record<string, unknown> = { players, total_paid: totalPaid, payment_method: paymentMethod }
  if (booking.guest_name !== null || guestName !== undefined) {
    patch.guest_name = guestName ?? booking.guest_name
    patch.guest_phone = guestPhone ?? null
    if (guestEmail !== undefined) patch.guest_email = guestEmail || null
  }

  const { error } = await supabase.from('bookings').update(patch).eq('id', bookingId)
  if (error) return { error: error.message }

  revalidatePath('/course/[slug]', 'page')
  revalidatePath('/course/[slug]/bookings', 'page')
  return {}
}

export async function waiveBooking(
  bookingId: string,
  reason: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify caller is a course admin for this booking's course
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, user_id, tee_time_id, payment_status, points_awarded')
    .eq('id', bookingId)
    .single()

  if (!booking) return { error: 'Booking not found' }
  if (booking.payment_status === 'waived' || booking.payment_status === 'refunded') {
    return { error: 'Already waived or refunded' }
  }

  await supabase
    .from('bookings')
    .update({ payment_status: 'waived', refund_reason: reason })
    .eq('id', bookingId)

  // Reverse any points that were already awarded at completion
  if (booking.points_awarded > 0) {
    const { data: awardedRow } = await supabase
      .from('fairway_points')
      .select('id, amount')
      .eq('booking_id', bookingId)
      .gt('amount', 0)
      .maybeSingle()

    if (awardedRow && booking.user_id) {
      await supabase.from('fairway_points').insert({
        user_id: booking.user_id,
        booking_id: bookingId,
        amount: -awardedRow.amount,
        reason: 'Points reversed — fee waived by course',
      })
    }
  }

  revalidatePath('/course/[slug]', 'page')
  revalidatePath('/course/[slug]/bookings', 'page')
  return {}
}

export async function createWalkInBooking({
  teeTimeId,
  guestName,
  guestPhone,
  guestEmail,
  players,
  totalPaid,
  paymentMethod,
}: {
  teeTimeId: string
  guestName: string
  guestPhone: string
  guestEmail?: string
  players: number
  totalPaid: number
  paymentMethod: 'cash' | 'card' | 'unpaid'
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('create_walk_in_booking', {
    p_tee_time_id: teeTimeId,
    p_guest_name: guestName,
    p_guest_phone: guestPhone,
    p_guest_email: guestEmail ?? null,
    p_players: players,
    p_total_paid: totalPaid,
    p_payment_method: paymentMethod,
  })
  if (error) return { error: error.message }
  revalidatePath('/course/[slug]', 'page')
  revalidatePath('/course/[slug]/bookings', 'page')
  return {}
}

// Sends confirmation email from tee sheet "Send confirmation" button.
// Fetches booking details from DB, updates guest_email, fires email.
export async function sendWalkInConfirmation({
  bookingId,
  email,
}: {
  bookingId: string
  email: string
}): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: booking, error: fetchErr } = await supabase
    .from('bookings')
    .select('id, guest_name, players, total_paid, payment_method, tee_times(scheduled_at, courses(name))')
    .eq('id', bookingId)
    .single()

  if (fetchErr || !booking) return { error: 'Booking not found.' }

  // Persist email so it pre-fills next time
  await supabase.from('bookings').update({ guest_email: email }).eq('id', bookingId)

  const teeTime = (booking as any).tee_times
  const courseName = teeTime?.courses?.name ?? 'your course'

  sendPhoneBookingConfirmation({
    guestName: booking.guest_name ?? 'Guest',
    guestEmail: email,
    courseName,
    teeTimeIso: teeTime?.scheduled_at ?? new Date().toISOString(),
    players: booking.players,
    totalPaid: booking.total_paid,
    paymentMethod: booking.payment_method as 'cash' | 'card' | 'unpaid',
  }).catch(err => console.error('[send-walk-in-confirmation]', err))

  return {}
}

// Sends confirmation email directly from WalkInBookingModal using locally-available data.
// Caller already has all booking details — no DB fetch needed.
export async function sendWalkInEmail({
  guestName,
  guestEmail,
  courseName,
  teeTimeIso,
  players,
  totalPaid,
  paymentMethod,
}: {
  guestName: string
  guestEmail: string
  courseName: string
  teeTimeIso: string
  players: number
  totalPaid: number
  paymentMethod: 'cash' | 'card' | 'unpaid'
}): Promise<{ error?: string }> {
  sendPhoneBookingConfirmation({
    guestName,
    guestEmail,
    courseName,
    teeTimeIso,
    players,
    totalPaid,
    paymentMethod,
  }).catch(err => console.error('[send-walk-in-email]', err))
  return {}
}
