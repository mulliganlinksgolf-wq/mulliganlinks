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
