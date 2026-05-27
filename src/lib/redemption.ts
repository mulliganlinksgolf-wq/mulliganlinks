import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'

export type RedemptionCheckResult = { ok: true } | { ok: false; error: string }

type RedemptionSettings = {
  points_threshold: number
  max_redemptions_fairway: number
  max_redemptions_eagle: number
  max_redemptions_ace: number
  blackout_dates: string[]
  eligible_slot_start: string | null
  eligible_slot_end: string | null
  monthly_redemption_cap: number | null
  notice_hours: number
}

const DEFAULTS: RedemptionSettings = {
  points_threshold: 5000,
  max_redemptions_fairway: 1,
  max_redemptions_eagle: 2,
  max_redemptions_ace: 3,
  blackout_dates: [],
  eligible_slot_start: null,
  eligible_slot_end: null,
  monthly_redemption_cap: null,
  notice_hours: 48,
}

export const COMP_DEFAULT: Record<string, number> = { eagle: 1, ace: 2 }

const TIER_MAX_KEY: Record<string, keyof RedemptionSettings> = {
  fairway: 'max_redemptions_fairway',
  eagle:   'max_redemptions_eagle',
  ace:     'max_redemptions_ace',
}

export async function getRedemptionSettings(
  supabase: SupabaseClient,
  courseId: string,
): Promise<RedemptionSettings> {
  const { data } = await supabase
    .from('course_redemption_settings')
    .select('*')
    .eq('course_id', courseId)
    .single()
  return (data as RedemptionSettings | null) ?? DEFAULTS
}

export async function checkRedemptionAllowed(
  supabase: SupabaseClient,
  {
    courseId,
    userId,
    tier,
    teeTimeAt,
    membershipCreatedAt,
    redemptionType,
    pointsBalance,
  }: {
    courseId: string
    userId: string
    tier: string
    teeTimeAt: string
    membershipCreatedAt: string
    redemptionType: 'points' | 'complimentary'
    pointsBalance: number
  },
): Promise<RedemptionCheckResult> {
  const s = await getRedemptionSettings(supabase, courseId)
  const teeDate = new Date(teeTimeAt)
  const now = new Date()

  // Notice period
  const hoursUntil = (teeDate.getTime() - now.getTime()) / 3_600_000
  if (hoursUntil < s.notice_hours) {
    return { ok: false, error: `Redemptions must be booked at least ${s.notice_hours} hours in advance.` }
  }

  // Blackout date
  const teeDateStr = teeDate.toISOString().slice(0, 10)
  if (s.blackout_dates.includes(teeDateStr)) {
    return { ok: false, error: 'This date is not eligible for redemptions at this course.' }
  }

  // Eligible slot window
  if (s.eligible_slot_start && s.eligible_slot_end) {
    const teeHHMM = teeDate.toISOString().slice(11, 16)
    if (teeHHMM < s.eligible_slot_start || teeHHMM > s.eligible_slot_end) {
      return {
        ok: false,
        error: `Redemptions at this course are only available ${s.eligible_slot_start}–${s.eligible_slot_end}.`,
      }
    }
  }

  if (redemptionType === 'points') {
    // Points threshold
    if (pointsBalance < s.points_threshold) {
      return {
        ok: false,
        error: `You need ${s.points_threshold.toLocaleString()} points to redeem a free round here.`,
      }
    }

    // Seasonal cap (membership anniversary year)
    const maxKey = TIER_MAX_KEY[tier] ?? 'max_redemptions_fairway'
    const maxAllowed = s[maxKey] as number

    const memberSince = new Date(membershipCreatedAt)
    const yearStart = new Date(memberSince)
    yearStart.setFullYear(now.getFullYear())
    if (yearStart > now) yearStart.setFullYear(now.getFullYear() - 1)

    const { count: seasonCount } = await (supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('redemption_type', 'points')
      .gte('created_at', yearStart.toISOString()) as unknown as Promise<{ count: number | null }>)

    if ((seasonCount ?? 0) >= maxAllowed) {
      return { ok: false, error: "You've reached your redemption limit at this course for this membership year." }
    }
  }

  // Monthly cap (both redemption types count)
  if (s.monthly_redemption_cap !== null) {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const { count: monthCount } = await (supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', courseId)
      .in('redemption_type', ['points', 'complimentary'])
      .gte('created_at', monthStart) as unknown as Promise<{ count: number | null }>)

    if ((monthCount ?? 0) >= s.monthly_redemption_cap) {
      return { ok: false, error: 'This course has reached its monthly redemption limit. Try again next month.' }
    }
  }

  return { ok: true }
}

// Lazily resets comp rounds when anniversary has passed. Safe to call on
// every booking — no-ops if reset_at is still in the future.
export async function resetCompRoundsIfNeeded(
  supabase: SupabaseClient,
  userId: string,
  tier: string,
): Promise<number> {
  const { data: membership } = await supabase
    .from('memberships')
    .select('comp_rounds_remaining, comp_rounds_reset_at')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (!membership) return 0

  const resetAt = membership.comp_rounds_reset_at
    ? new Date(membership.comp_rounds_reset_at as string)
    : null

  if (!resetAt || resetAt > new Date()) {
    return membership.comp_rounds_remaining as number
  }

  const newResetAt = new Date(resetAt)
  while (newResetAt <= new Date()) {
    newResetAt.setFullYear(newResetAt.getFullYear() + 1)
  }

  const newRemaining = COMP_DEFAULT[tier] ?? 0
  const admin = createAdminClient()
  await admin
    .from('memberships')
    .update({
      comp_rounds_remaining: newRemaining,
      comp_rounds_reset_at: newResetAt.toISOString(),
    })
    .eq('user_id', userId)
    .eq('status', 'active')

  return newRemaining
}
