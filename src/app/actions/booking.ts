'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendBookingConfirmation, sendCourseBookingAlert, sendCancellationConfirmation } from '@/lib/emails'
import { platformFeeCents } from '@/lib/stripe/fees'

const MONTHLY_CREDIT_CENTS: Record<string, number> = { eagle: 1000, ace: 2000 }

/**
 * Issues this month's tee-time credit if it hasn't been issued yet,
 * then returns the total available credit balance in cents.
 * Safe to call on every page load — the unique index prevents duplicates.
 */
export async function getAndIssueMemberCredits(userId: string, tier: string): Promise<number> {
  const amountCents = MONTHLY_CREDIT_CENTS[tier] ?? 0
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

export async function createPendingBooking({
  teeTimeId,
  players,
  tier,
  guestPassId,
}: {
  teeTimeId: string
  players: number
  tier: string
  guestPassId?: string
}): Promise<{ bookingId?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()

  const { data: teeTime } = await admin
    .from('tee_times')
    .select('id, available_players, status, base_price, course_id')
    .eq('id', teeTimeId)
    .single()

  if (!teeTime || teeTime.status !== 'open' || teeTime.available_players < players) {
    return { error: 'This tee time is no longer available.' }
  }

  // Validate guest pass server-side before applying
  let verifiedPassId: string | null = null
  if (guestPassId) {
    const { data: pass } = await admin
      .from('guest_passes')
      .select('id')
      .eq('id', guestPassId)
      .eq('user_id', user.id)
      .is('redeemed_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()
    verifiedPassId = pass?.id ?? null
  }

  const discountCents = verifiedPassId ? 1500 : 0
  const greenFeeCents = Math.round((teeTime.base_price as number) * players * 100)
  const appFeeCents = platformFeeCents(tier)
  const totalCents = greenFeeCents + appFeeCents - discountCents

  const { data: booking, error } = await admin
    .from('bookings')
    .insert({
      tee_time_id: teeTimeId,
      user_id: user.id,
      players,
      total_paid: totalCents / 100,
      status: 'pending_payment',
      payment_status: 'pending',
      green_fee_cents: greenFeeCents,
      platform_fee_cents: appFeeCents,
      total_charged_cents: totalCents,
      points_awarded: 0,
      discount_cents: discountCents,
      guest_pass_id: verifiedPassId,
    })
    .select('id')
    .single()

  if (error || !booking) return { error: 'Failed to create booking.' }

  // Mark pass redeemed immediately
  if (verifiedPassId) {
    await admin
      .from('guest_passes')
      .update({ redeemed_at: new Date().toISOString(), booking_id: booking.id })
      .eq('id', verifiedPassId)
  }

  return { bookingId: booking.id }
}

export async function confirmBooking({
  teeTimeId,
  userId,
  players,
  subtotal,
  discount,
  pointsRedeemed,
  creditsRedeemedCents,
  rainCheckId,
  total,
  pointsEarned,
  tier,
  guestPassId,
  redemptionType,
}: {
  teeTimeId: string
  userId: string
  players: number
  subtotal: number
  discount: number
  pointsRedeemed: number
  creditsRedeemedCents?: number
  rainCheckId?: string
  total: number
  pointsEarned: number
  tier: string
  guestPassId?: string
  redemptionType?: 'points' | 'complimentary'
}) {
  const supabase = await createClient()

  // Verify tee time is still available
  const { data: teeTime } = await supabase
    .from('tee_times')
    .select('id, available_players, status, course_id, scheduled_at')
    .eq('id', teeTimeId)
    .single()

  if (!teeTime || teeTime.status !== 'open' || teeTime.available_players < players) {
    return { error: 'This tee time is no longer available.' }
  }

  // Validate guest pass server-side
  const guestPassAdmin = createAdminClient()
  let verifiedPassId: string | null = null
  if (guestPassId) {
    const { data: pass } = await guestPassAdmin
      .from('guest_passes')
      .select('id')
      .eq('id', guestPassId)
      .eq('user_id', userId)
      .is('redeemed_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()
    verifiedPassId = pass?.id ?? null
  }

  const discountCents = verifiedPassId ? 1500 : 0
  const adjustedTotal = total - discountCents / 100

  // Redemption enforcement — runs for both complimentary and points free-round paths
  if (redemptionType === 'points' || redemptionType === 'complimentary') {
    const { checkRedemptionAllowed, resetCompRoundsIfNeeded } = await import('@/lib/redemption')

    // Fetch membership for comp balance + anniversary date
    const { data: membership } = await supabase
      .from('memberships')
      .select('comp_rounds_remaining, created_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (redemptionType === 'complimentary') {
      const remaining = await resetCompRoundsIfNeeded(supabase, userId, tier)
      if (remaining <= 0) return { error: 'No complimentary rounds remaining.' }
    }

    // Fetch actual points balance server-side (don't trust client value)
    let pointsBalance = 0
    if (redemptionType === 'points') {
      const { data: pointsRows } = await supabase
        .from('fairway_points')
        .select('amount')
        .eq('user_id', userId)
      pointsBalance = (pointsRows ?? []).reduce((s, r) => s + (r.amount as number), 0)
    }

    const check = await checkRedemptionAllowed(supabase, {
      courseId: teeTime.course_id as string,
      userId,
      tier,
      teeTimeAt: teeTime.scheduled_at as string,
      membershipCreatedAt: membership?.created_at ?? new Date().toISOString(),
      redemptionType,
      pointsBalance,
    })
    if (!check.ok) return { error: check.error }
  }

  // Create booking
  // TODO: Replace total_paid with Stripe PaymentIntent amount when Stripe is wired
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      tee_time_id: teeTimeId,
      user_id: userId,
      players,
      total_paid: adjustedTotal,
      status: 'confirmed',
      points_awarded: pointsEarned,
      discount_cents: discountCents,
      guest_pass_id: verifiedPassId,
      course_id: teeTime.course_id,
      redemption_type: redemptionType ?? null,
    })
    .select('id')
    .single()

  if (bookingError || !booking) {
    return { error: 'Failed to create booking. Please try again.' }
  }

  // Mark guest pass redeemed
  if (verifiedPassId) {
    await guestPassAdmin
      .from('guest_passes')
      .update({ redeemed_at: new Date().toISOString(), booking_id: booking.id })
      .eq('id', verifiedPassId)
  }

  // Decrement available players
  await supabase
    .from('tee_times')
    .update({
      available_players: teeTime.available_players - players,
      status: teeTime.available_players - players === 0 ? 'booked' : 'open',
    })
    .eq('id', teeTimeId)

  // Points are awarded at round completion, not at booking time.
  // points_awarded on the booking row records what will be earned.

  // Deduct redeemed points immediately — member already paid less
  if (pointsRedeemed > 0) {
    await supabase.from('fairway_points').insert({
      user_id: userId,
      course_id: teeTime.course_id,
      booking_id: booking.id,
      amount: -pointsRedeemed,
      reason: redemptionType === 'points' ? 'Free round redeemed' : 'Points redeemed at booking',
    })
  }

  // Supabase doesn't support inline arithmetic in .update(); fetch and decrement explicitly.
  // Must use admin client — members have no UPDATE policy on memberships.
  if (redemptionType === 'complimentary') {
    const adminComp = createAdminClient()
    const { data: mem } = await adminComp
      .from('memberships')
      .select('comp_rounds_remaining')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()
    if (mem) {
      await adminComp
        .from('memberships')
        .update({ comp_rounds_remaining: (mem.comp_rounds_remaining as number) - 1 })
        .eq('user_id', userId)
        .eq('status', 'active')
    }
  }

  // Mark member credits as used (oldest first, up to creditsRedeemedCents)
  if (creditsRedeemedCents && creditsRedeemedCents > 0) {
    const adminClient2 = createAdminClient()
    const { data: availableCredits } = await adminClient2
      .from('member_credits')
      .select('id, amount_cents')
      .eq('user_id', userId)
      .eq('status', 'available')
      .gt('expires_at', new Date().toISOString())
      .order('created_at')

    let remaining = creditsRedeemedCents
    for (const credit of availableCredits ?? []) {
      if (remaining <= 0) break
      remaining -= credit.amount_cents
      await adminClient2
        .from('member_credits')
        .update({ status: 'used', redeemed_booking_id: booking.id })
        .eq('id', credit.id)
    }
  }

  // Redeem rain check if provided
  if (rainCheckId) {
    const adminRc = createAdminClient()
    await adminRc
      .from('rain_checks')
      .update({ status: 'redeemed', redeemed_booking_id: booking.id })
      .eq('id', rainCheckId)
      .eq('status', 'available')
  }

  // Fire-and-forget emails — never block booking confirmation
  const adminClient = createAdminClient()
  const [, { data: memberProfile }, { data: teeTimeFull }] = await Promise.all([
    sendBookingConfirmation({ userId, bookingId: booking.id, teeTimeId, players, total, pointsEarned }).catch(() => {}),
    adminClient.from('profiles').select('full_name, email').eq('id', userId).single(),
    adminClient.from('tee_times').select('scheduled_at, courses(id, name, slug)').eq('id', teeTimeId).single(),
  ])

  const course = (teeTimeFull as any)?.courses
  if (course && memberProfile) {
    sendCourseBookingAlert({
      courseId: course.id,
      courseSlug: course.slug ?? '',
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

const MULTIPLIER: Record<string, number> = { free: 1, fairway: 1, eagle: 1.5, ace: 2 }

export async function cancelBooking(bookingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, tee_time_id, players, status, points_awarded, redemption_type, tee_times(scheduled_at, courses(name))')
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

  // Restore any points the member redeemed at booking (negative rows for this booking)
  const { data: redeemedRows } = await supabase
    .from('fairway_points')
    .select('amount')
    .eq('booking_id', bookingId)
    .lt('amount', 0)

  const totalRedeemed = (redeemedRows ?? []).reduce((sum, r) => sum + r.amount, 0)
  if (totalRedeemed < 0) {
    await supabase.from('fairway_points').insert({
      user_id: user.id,
      booking_id: bookingId,
      amount: -totalRedeemed,
      reason: 'Booking canceled — redeemed points restored',
    })
  }

  // Restore comp round if the canceled booking used one.
  // Must use admin client — members have no UPDATE policy on memberships.
  if ((booking as any).redemption_type === 'complimentary') {
    const COMP_MAX: Record<string, number> = { eagle: 1, ace: 2 }
    const adminCancel = createAdminClient()
    const { data: mem } = await adminCancel
      .from('memberships')
      .select('tier, comp_rounds_remaining')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()
    if (mem) {
      const cap = COMP_MAX[(mem as any).tier] ?? 0
      const restored = Math.min((mem as any).comp_rounds_remaining + 1, cap)
      await adminCancel
        .from('memberships')
        .update({ comp_rounds_remaining: restored })
        .eq('user_id', user.id)
        .eq('status', 'active')
    }
  }

  // TODO: Stripe refund goes here when payment is wired

  // Fire-and-forget cancellation confirmation
  const teeTimeData = booking.tee_times as any
  sendCancellationConfirmation({
    userId: user.id,
    courseName: teeTimeData?.courses?.name ?? 'the course',
    teeTimeIso: teeTimeData?.scheduled_at ?? '',
    players: booking.players,
    redeemedPointsRestored: totalRedeemed < 0 ? -totalRedeemed : 0,
  }).catch(() => {})

  return { ok: true }
}
