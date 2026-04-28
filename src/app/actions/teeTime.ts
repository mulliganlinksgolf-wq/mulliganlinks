'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateTeeTimeStatus(teeTimeId: string, status: 'open' | 'blocked') {
  const supabase = await createClient()
  await supabase.from('tee_times').update({ status }).eq('id', teeTimeId)
  revalidatePath('/course/[slug]', 'page')
}

export async function updateBookingStatus(bookingId: string, status: 'completed' | 'no_show') {
  const supabase = await createClient()
  await supabase.from('bookings').update({ status }).eq('id', bookingId)
  revalidatePath('/course/[slug]', 'page')
}

export async function updateBooking({
  bookingId,
  players,
  totalPaid,
  paymentMethod,
  guestName,
  guestPhone,
}: {
  bookingId: string
  players: number
  totalPaid: number
  paymentMethod: 'cash' | 'card'
  guestName?: string
  guestPhone?: string
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
  }

  const { error } = await supabase.from('bookings').update(patch).eq('id', bookingId)
  if (error) return { error: error.message }

  revalidatePath('/course/[slug]', 'page')
  revalidatePath('/course/[slug]/bookings', 'page')
  return {}
}

export async function createWalkInBooking({
  teeTimeId,
  guestName,
  guestPhone,
  players,
  totalPaid,
  paymentMethod,
}: {
  teeTimeId: string
  guestName: string
  guestPhone: string
  players: number
  totalPaid: number
  paymentMethod: 'cash' | 'card' | 'unpaid'
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('create_walk_in_booking', {
    p_tee_time_id: teeTimeId,
    p_guest_name: guestName,
    p_guest_phone: guestPhone,
    p_players: players,
    p_total_paid: totalPaid,
    p_payment_method: paymentMethod,
  })
  if (error) return { error: error.message }
  revalidatePath('/course/[slug]', 'page')
  revalidatePath('/course/[slug]/bookings', 'page')
  return {}
}
