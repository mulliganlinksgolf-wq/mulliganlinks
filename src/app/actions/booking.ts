'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendBookingConfirmation, sendCourseBookingAlert } from '@/lib/emails'

export async function confirmBooking({
  teeTimeId,
  userId,
  players,
  subtotal,
  discount,
  pointsRedeemed,
  total,
  pointsEarned,
  tier,
}: {
  teeTimeId: string
  userId: string
  players: number
  subtotal: number
  discount: number
  pointsRedeemed: number
  total: number
  pointsEarned: number
  tier: string
}) {
  const supabase = await createClient()

  // Verify tee time is still available
  const { data: teeTime } = await supabase
    .from('tee_times')
    .select('id, available_players, status, course_id')
    .eq('id', teeTimeId)
    .single()

  if (!teeTime || teeTime.status !== 'open' || teeTime.available_players < players) {
    return { error: 'This tee time is no longer available.' }
  }

  // Create booking
  // TODO: Replace total_paid with Stripe PaymentIntent amount when Stripe is wired
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      tee_time_id: teeTimeId,
      user_id: userId,
      players,
      total_paid: total,
      status: 'confirmed',
      points_awarded: pointsEarned,
    })
    .select('id')
    .single()

  if (bookingError || !booking) {
    return { error: 'Failed to create booking. Please try again.' }
  }

  // Decrement available players
  await supabase
    .from('tee_times')
    .update({
      available_players: teeTime.available_players - players,
      status: teeTime.available_players - players === 0 ? 'booked' : 'open',
    })
    .eq('id', teeTimeId)

  // Award points
  if (pointsEarned > 0) {
    await supabase.from('fairway_points').insert({
      user_id: userId,
      course_id: teeTime.course_id,
      booking_id: booking.id,
      amount: pointsEarned,
      reason: `Booking at ${tier} rate (${MULTIPLIER[tier] ?? 1}x)`,
    })
  }

  // Deduct redeemed points
  if (pointsRedeemed > 0) {
    await supabase.from('fairway_points').insert({
      user_id: userId,
      course_id: teeTime.course_id,
      booking_id: booking.id,
      amount: -pointsRedeemed,
      reason: 'Points redeemed at booking',
    })
  }

  // Fire-and-forget emails — never block booking confirmation
  const adminClient = createAdminClient()
  const [, { data: memberProfile }, { data: teeTimeFull }] = await Promise.all([
    sendBookingConfirmation({ userId, bookingId: booking.id, teeTimeId, players, total, pointsEarned }).catch(() => {}),
    adminClient.from('profiles').select('full_name, email').eq('id', userId).single(),
    adminClient.from('tee_times').select('scheduled_at, courses(id, name)').eq('id', teeTimeId).single(),
  ])

  const course = (teeTimeFull as any)?.courses
  if (course && memberProfile) {
    sendCourseBookingAlert({
      courseId: course.id,
      memberName: memberProfile.full_name ?? 'Member',
      memberEmail: memberProfile.email ?? '',
      players,
      total,
      teeTimeIso: teeTimeFull?.scheduled_at ?? '',
      courseName: course.name,
    }).catch(() => {})
  }

  return { bookingId: booking.id }
}

const MULTIPLIER: Record<string, number> = { free: 1, eagle: 2, ace: 3 }

export async function cancelBooking(bookingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, tee_time_id, players, status, points_awarded, tee_times(scheduled_at)')
    .eq('id', bookingId)
    .eq('user_id', user.id)
    .single()

  if (!booking) return { error: 'Booking not found' }
  if (booking.status !== 'confirmed') return { error: 'This booking cannot be canceled' }

  const scheduledAt = new Date((booking.tee_times as any)?.scheduled_at)
  if (scheduledAt.getTime() - Date.now() < 60 * 60 * 1000) {
    return { error: 'Cancellations must be made at least 1 hour before tee time.' }
  }

  // Cancel the booking
  await supabase.from('bookings').update({ status: 'canceled' }).eq('id', bookingId)

  // Restore tee time availability
  const { data: teeTime } = await supabase
    .from('tee_times')
    .select('available_players, max_players')
    .eq('id', booking.tee_time_id)
    .single()

  if (teeTime) {
    await supabase.from('tee_times').update({
      available_players: teeTime.available_players + booking.players,
      status: 'open',
    }).eq('id', booking.tee_time_id)
  }

  // Reverse points awarded
  if (booking.points_awarded > 0) {
    await supabase.from('fairway_points').insert({
      user_id: user.id,
      booking_id: bookingId,
      amount: -booking.points_awarded,
      reason: 'Booking canceled — points reversed',
    })
  }

  // TODO: Stripe refund goes here when payment is wired

  return { ok: true }
}
