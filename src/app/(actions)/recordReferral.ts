'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getReferralCodeFromCookie, clearReferralCookie } from '@/lib/referrals/capture'

export interface RecordReferralResult {
  attributed: boolean
  courseId?: string
  method?: 'link' | 'dropdown'
  error?: string
}

/**
 * Record referral attribution for a newly created profile.
 * Priority: cookie (link/QR) > dropdown selection.
 * A golfer can only ever be attributed to one course — the UNIQUE constraint on
 * profile_id enforces this at the DB level. Duplicate attempts are silently ignored.
 */
export async function recordReferral({
  profileId,
  selectedCourseId,
}: {
  profileId: string
  selectedCourseId?: string | null
}): Promise<RecordReferralResult> {
  const supabase = createAdminClient()

  let courseId: string | null = null
  let method: 'link' | 'dropdown' | null = null

  // 1. Cookie wins (link / QR attribution)
  const cookieCode = await getReferralCodeFromCookie()
  if (cookieCode) {
    const { data: course } = await supabase
      .from('courses')
      .select('id')
      .eq('referral_code', cookieCode)
      .eq('status', 'active')
      .single()
    if (course) {
      courseId = course.id
      method = 'link'
    }
  }

  // 2. Fall back to dropdown selection
  if (!courseId && selectedCourseId) {
    const { data: course } = await supabase
      .from('courses')
      .select('id')
      .eq('id', selectedCourseId)
      .eq('status', 'active')
      .single()
    if (course) {
      courseId = course.id
      method = 'dropdown'
    }
  }

  if (!courseId || !method) return { attributed: false }

  const expiresAt = new Date()
  expiresAt.setFullYear(expiresAt.getFullYear() + 1)

  const { error } = await supabase.from('course_referrals').insert({
    profile_id: profileId,
    course_id: courseId,
    attribution_method: method,
    expires_at: expiresAt.toISOString(),
  })

  if (error) {
    if (error.code === '23505') {
      // Unique violation — golfer already attributed. Silent no-op.
      return { attributed: false }
    }
    console.error('[referral] insert failed', error)
    return { attributed: false, error: error.message }
  }

  await clearReferralCookie()
  return { attributed: true, courseId, method }
}
