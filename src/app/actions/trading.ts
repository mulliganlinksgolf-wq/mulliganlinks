// src/app/actions/trading.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calcListingExpiry, canCreateListing } from '@/lib/trading'

// ─── Create Listing ───────────────────────────────────────────────────────────

export async function createListing(bookingId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()

  // Fetch the booking with its tee time and the course trading settings
  const { data: booking } = await admin
    .from('bookings')
    .select(`
      id, status, total_paid, user_id,
      tee_times (
        id, scheduled_at, course_id,
        courses ( trading_enabled, trading_min_hours_before )
      )
    `)
    .eq('id', bookingId)
    .single()

  if (!booking || booking.user_id !== user.id) return { error: 'Booking not found' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tt = booking.tee_times as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const course = tt?.courses as any

  const eligible = canCreateListing({
    scheduledAt: tt.scheduled_at,
    bookingStatus: booking.status,
    tradingEnabled: course?.trading_enabled ?? false,
    minHoursBefore: course?.trading_min_hours_before ?? 4,
  })

  if (!eligible) return { error: 'This booking is not eligible for listing. Make sure the course has trading enabled and the tee time is far enough away.' }

  const expiresAt = calcListingExpiry(
    tt.scheduled_at,
    course?.trading_min_hours_before ?? 4,
  )

  const { error } = await supabase.from('tee_time_listings').insert({
    tee_time_id:         tt.id,
    course_id:           tt.course_id,
    listed_by_member_id: user.id,
    booking_id:          bookingId,
    credit_amount_cents: Math.round((booking.total_paid as number) * 100),
    expires_at:          expiresAt.toISOString(),
  })

  if (error) {
    if (error.code === '23505') return { error: 'You already have an active listing for this booking.' }
    return { error: error.message }
  }

  revalidatePath('/app/bookings')
  revalidatePath('/app/trading')
  return {}
}

// ─── Claim Listing ────────────────────────────────────────────────────────────

export async function claimListing(
  listingId: string
): Promise<{ error?: string; creditCents?: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase.rpc('claim_listing', {
    p_listing_id:  listingId,
    p_claimant_id: user.id,
  })

  if (error) return { error: error.message }
  if (data?.error) return { error: data.error }

  revalidatePath('/app/trading')
  revalidatePath('/app/bookings')
  return { creditCents: data.credit_cents as number }
}

// ─── Cancel Listing ───────────────────────────────────────────────────────────

export async function cancelListing(listingId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('tee_time_listings')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', listingId)
    .eq('listed_by_member_id', user.id)
    .eq('status', 'active')

  if (error) return { error: error.message }

  revalidatePath('/app/bookings')
  revalidatePath('/app/trading')
  return {}
}

// ─── Update Course Trading Settings ──────────────────────────────────────────

export async function updateTradingSettings(
  courseId: string,
  settings: { trading_enabled: boolean; trading_min_hours_before: number }
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('courses')
    .update({ ...settings, updated_at: new Date().toISOString() })
    .eq('id', courseId)

  if (error) return { error: error.message }
  revalidatePath('/app/trading')
  return {}
}
