'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function toggleSelfGroupingForDay({
  courseSlug,
  date,
}: {
  courseSlug: string
  date: string // YYYY-MM-DD
}): Promise<{ ok: true; disabled: boolean } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()

  // Look up course id from slug
  const { data: course } = await admin
    .from('courses')
    .select('id')
    .eq('slug', courseSlug)
    .single()
  if (!course) return { error: 'Course not found' }

  // Authorize: user must be in course_admins for this course
  const { data: staffRow } = await admin
    .from('course_admins')
    .select('user_id')
    .eq('course_id', course.id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!staffRow) return { error: 'Not authorized' }

  // Toggle: if a row exists for this date, flip; otherwise insert disabled=true
  const { data: existing } = await admin
    .from('course_tee_sheet_overrides')
    .select('id, self_grouping_disabled')
    .eq('course_id', course.id)
    .eq('override_date', date)
    .maybeSingle()

  let newDisabled: boolean

  if (existing) {
    newDisabled = !existing.self_grouping_disabled
    const { error } = await admin
      .from('course_tee_sheet_overrides')
      .update({ self_grouping_disabled: newDisabled, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) return { error: error.message }
  } else {
    newDisabled = true
    const { error } = await admin
      .from('course_tee_sheet_overrides')
      .insert({
        course_id: course.id,
        override_date: date,
        self_grouping_disabled: true,
      })
    if (error) return { error: error.message }
  }

  revalidatePath('/course/[slug]/bookings', 'page')
  return { ok: true, disabled: newDisabled }
}
