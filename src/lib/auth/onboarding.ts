import { timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const ONBOARDING_COOKIE = 'teeahead-onboarding-invite'

/** Every read and mutation checks the invite again, including revocation. */
export async function requireOnboardingAccess(courseId: string, allowCompleted = false) {
  const admin = createAdminClient()
  const { data: course, error } = await admin.from('courses')
    .select('id, invite_token, invite_used, onboarding_complete')
    .eq('id', courseId).maybeSingle()
  if (error || !course) throw new Error('Invalid or expired course access')

  const token = (await cookies()).get(ONBOARDING_COOKIE)?.value
  const expected = course.invite_token as string | null
  const inviteMatches = !!token && !!expected &&
    Buffer.byteLength(token) === Buffer.byteLength(expected) &&
    timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  if (inviteMatches && (!course.invite_used || (allowCompleted && course.onboarding_complete))) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Valid course invite or manager sign-in required')
  const [{ data: profile }, { data: staff }, { data: crmStaff }] = await Promise.all([
    admin.from('profiles').select('is_admin').eq('id', user.id).maybeSingle(),
    admin.from('course_admins').select('role').eq('user_id', user.id).eq('course_id', courseId).maybeSingle(),
    admin.from('crm_course_users').select('role').eq('user_id', user.id).eq('course_id', courseId).maybeSingle(),
  ])
  if (!profile?.is_admin && ![staff?.role, crmStaff?.role].some(role => role === 'owner' || role === 'manager')) {
    throw new Error('Not authorized to manage this course')
  }
}
