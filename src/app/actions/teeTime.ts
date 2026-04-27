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
