import { getCourseBookingAccess } from '@/lib/course-billing/access'
import { bookingsPaused } from '@/lib/course-billing/model'
import { reconcileReservations } from '@/lib/booking-lifecycle'
import { createAdminClient } from '@/lib/supabase/admin'
import { platformFeeCents } from '@/lib/stripe/fees'
import { checkRedemptionAllowed, getRedemptionSettings, COMP_DEFAULT } from '@/lib/redemption'

export type BookingSelection = {
  teeTimeId: string
  players: number
  guestPassId?: string
  redemptionType?: 'points' | 'complimentary'
  pointsRedeemed?: number
  creditsRedeemedCents?: number
  rainCheckId?: string
  cartSelected?: boolean
  joinExistingGroup?: boolean
}

export async function getBookingQuote(userId: string, input: BookingSelection, online: boolean) {
  if (!Number.isInteger(input.players) || input.players < 1 || input.players > 4) throw new Error('Choose between 1 and 4 players')
  for (const n of [input.pointsRedeemed ?? 0, input.creditsRedeemedCents ?? 0]) {
    if (!Number.isSafeInteger(n) || n < 0) throw new Error('Invalid redemption amount')
  }
  if (input.redemptionType && !['points', 'complimentary'].includes(input.redemptionType)) throw new Error('Invalid redemption type')
  const admin = createAdminClient()
  const { data: slotCourse } = await admin.from('tee_times').select('course_id').eq('id', input.teeTimeId).maybeSingle()
  if (slotCourse) await reconcileReservations(slotCourse.course_id)
  const { data: teeTime, error: teeError } = await admin.from('tee_times')
    .select('id, course_id, scheduled_at, available_players, base_price, special_price, status')
    .eq('id', input.teeTimeId).single()
  if (teeError || !teeTime || teeTime.status !== 'open' || teeTime.available_players < input.players || new Date(teeTime.scheduled_at).getTime() <= Date.now()) {
    throw new Error('This tee time is no longer available.')
  }
  if (bookingsPaused(await getCourseBookingAccess(teeTime.course_id), teeTime.scheduled_at)) throw new Error('This course is not accepting new bookings during its off-season. Please contact the course.')
  const [{ data: course, error: courseError }, { data: membership, error: memberError }, { data: config, error: configError }, { data: pricing, error: pricingError }] = await Promise.all([
    admin.from('courses').select('id, stripe_charges_enabled, allow_self_grouping, timezone').eq('id', teeTime.course_id).single(),
    admin.from('memberships').select('tier, created_at, comp_rounds_remaining, comp_rounds_reset_at').eq('user_id', userId).eq('status', 'active').maybeSingle(),
    admin.from('course_tee_sheet_config').select('cart_policy').eq('course_id', teeTime.course_id).maybeSingle(),
    admin.from('course_pricing').select('cart_fee_cents').eq('course_id', teeTime.course_id).eq('is_active', true).order('display_order').limit(1),
  ])
  if (courseError || memberError || configError || pricingError || !course) throw new Error('Unable to calculate this booking. Please try again.')
  if ((course.stripe_charges_enabled === true) !== online) throw new Error('Payment setup changed. Reload this booking to continue.')
  const tier = membership?.tier ?? 'free'
  const unitCents = Math.round(Number(teeTime.special_price ?? teeTime.base_price) * 100)
  if (!Number.isSafeInteger(unitCents) || unitCents < 0) throw new Error('Invalid course price')
  const cartSelected = config?.cart_policy === 'mandatory' || (config?.cart_policy !== 'walking_only' && !!input.cartSelected)
  const cartFeeCents = cartSelected ? Number(pricing?.[0]?.cart_fee_cents ?? 0) : 0
  if (!Number.isSafeInteger(cartFeeCents) || cartFeeCents < 0) throw new Error('Invalid cart price')
  const greenFeeCents = unitCents * input.players
  const appFeeCents = online ? platformFeeCents(tier) : 0
  let discountCents = 0
  if (input.guestPassId) {
    if (input.players < 2) throw new Error('A guest pass requires at least two players')
    const { data: pass, error } = await admin.from('guest_passes').select('id')
      .eq('id', input.guestPassId).eq('user_id', userId).is('redeemed_at', null)
      .gt('expires_at', new Date().toISOString()).maybeSingle()
    if (error || !pass) throw new Error('This guest pass is no longer available')
    discountCents = Math.min(1500, unitCents)
  }
  let totalCents = greenFeeCents + cartFeeCents - discountCents
  let pointsRedeemed = input.pointsRedeemed ?? 0
  let creditsRedeemedCents = input.creditsRedeemedCents ?? 0
  if (online && (input.redemptionType || pointsRedeemed || creditsRedeemedCents || input.rainCheckId)) {
    throw new Error('This payment form does not support that redemption')
  }
  const { data: points, error: pointsError } = await admin.from('fairway_points').select('amount').eq('user_id', userId)
  if (pointsError) throw new Error('Unable to verify points balance')
  const pointsBalance = (points ?? []).reduce((sum, row) => sum + Number(row.amount), 0)
  if (input.redemptionType) {
    if (!membership) throw new Error('An active membership is required')
    if (input.redemptionType === 'complimentary') {
      const compBalance = membership.comp_rounds_reset_at && new Date(membership.comp_rounds_reset_at) <= new Date()
        ? COMP_DEFAULT[tier] ?? 0 : membership.comp_rounds_remaining
      if (!['eagle', 'ace'].includes(tier) || compBalance <= 0) throw new Error('No complimentary rounds remaining')
      if (pointsRedeemed) throw new Error('Complimentary rounds cannot be combined with points')
    }
    const check = await checkRedemptionAllowed(admin, {
      courseId: course.id, userId, tier, teeTimeAt: teeTime.scheduled_at,
      membershipCreatedAt: membership.created_at, redemptionType: input.redemptionType, pointsBalance,
    })
    if (!check.ok) throw new Error(check.error)
    if (input.redemptionType === 'points') pointsRedeemed = (await getRedemptionSettings(admin, course.id)).points_threshold
    totalCents -= unitCents
  }
  if (creditsRedeemedCents) {
    const { data: credits, error } = await admin.from('member_credits').select('amount_cents')
      .eq('user_id', userId).eq('status', 'available').gt('expires_at', new Date().toISOString())
    if (error) throw new Error('Unable to verify credit balance')
    const balance = (credits ?? []).reduce((sum, row) => sum + Number(row.amount_cents), 0)
    if (creditsRedeemedCents > balance) throw new Error('Insufficient credits')
    creditsRedeemedCents = Math.min(creditsRedeemedCents, totalCents)
    totalCents -= creditsRedeemedCents
  }
  if (input.rainCheckId) {
    const { data: rainCheck, error } = await admin.from('rain_checks').select('amount_cents')
      .eq('id', input.rainCheckId).eq('user_id', userId).eq('course_id', course.id)
      .eq('status', 'available').gt('expires_at', new Date().toISOString()).maybeSingle()
    if (error || !rainCheck) throw new Error('This rain check is not available at this course')
    totalCents = Math.max(0, totalCents - Number(rainCheck.amount_cents))
  }
  if (pointsRedeemed > pointsBalance) throw new Error('Insufficient points')
  if (!input.redemptionType) {
    pointsRedeemed = Math.min(pointsRedeemed, totalCents)
    totalCents -= pointsRedeemed
  }
  const pointsAwarded = input.redemptionType === 'complimentary' ? 0 : Math.floor(totalCents / 100 * ({ eagle: 1.5, ace: 2 }[tier as 'eagle' | 'ace'] ?? 1))
  totalCents += appFeeCents
  if (online && totalCents < 50) throw new Error('Online payments must be at least $0.50. Please contact the course.')
  return {
    user_id: userId, tee_time_id: teeTime.id, course_id: course.id, players: input.players,
    tier, green_fee_cents: greenFeeCents, platform_fee_cents: appFeeCents,
    total_charged_cents: totalCents, discount_cents: discountCents, points_awarded: pointsAwarded,
    cart_selected: cartSelected, cart_fee_cents: cartFeeCents,
    guest_pass_id: input.guestPassId ?? null, rain_check_id: input.rainCheckId ?? null,
    redemption_type: input.redemptionType ?? null, points_redeemed: pointsRedeemed,
    credits_redeemed_cents: creditsRedeemedCents, join_existing_group: !!input.joinExistingGroup,
    status: online ? 'pending_payment' : 'confirmed',
  }
}
