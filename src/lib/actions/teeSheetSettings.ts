'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { DayHours } from '@/components/onboarding/HoursEditor'
import type { PricingRow } from '@/components/onboarding/PricingEditor'
import type { TeeSheetConfig } from '@/lib/db/onboarding'

async function assertCourseStaff(courseId: string): Promise<{ user: { id: string } } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()
  const { data: staffRow } = await admin
    .from('course_staff')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle()

  if (!staffRow) return { error: 'Unauthorized' }

  return { user }
}

export async function updateCourseHours(
  courseId: string,
  hours: DayHours[],
): Promise<{ error?: string }> {
  const auth = await assertCourseStaff(courseId)
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const rows = hours.map((h) => ({
    course_id: courseId,
    day_of_week: h.dayOfWeek,
    is_open: h.isOpen,
    open_time: h.openTime,
    close_time: h.closeTime,
  }))

  const { error } = await admin
    .from('course_hours')
    .upsert(rows, { onConflict: 'course_id,day_of_week' })

  if (error) return { error: error.message }
  return {}
}

export async function updateCoursePricing(
  courseId: string,
  tiers: PricingRow[],
): Promise<{ error?: string }> {
  const auth = await assertCourseStaff(courseId)
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const rows = tiers.map((t, index) => ({
    course_id: courseId,
    rate_name: t.rateName,
    green_fee_cents: t.greenFeeCents,
    cart_fee_cents: t.cartFeeCents,
    display_order: index,
    is_active: true,
  }))

  const { error } = await admin
    .from('course_pricing')
    .upsert(rows, { onConflict: 'course_id,rate_name' })

  if (error) return { error: error.message }
  return {}
}

export async function updateTeeSheetConfig(
  courseId: string,
  config: Partial<TeeSheetConfig>,
): Promise<{ error?: string }> {
  const auth = await assertCourseStaff(courseId)
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()

  // Strip id and course_id from the partial config — we set course_id ourselves
  const { id: _id, course_id: _cid, ...rest } = config as Partial<TeeSheetConfig> & { id?: string; course_id?: string }

  const { error } = await admin
    .from('course_tee_sheet_config')
    .upsert({ course_id: courseId, ...rest }, { onConflict: 'course_id' })

  if (error) return { error: error.message }
  return {}
}
