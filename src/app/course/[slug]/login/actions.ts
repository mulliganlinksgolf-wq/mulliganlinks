'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export async function loginCoursePartner(
  formData: FormData,
  slug: string,
): Promise<{ error: string }> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user) return { error: 'Invalid email or password' }

  const admin = createAdminClient()
  const { data: course } = await admin.from('courses').select('id').eq('slug', slug).single()
  if (!course) {
    await supabase.auth.signOut()
    return { error: 'Course not found' }
  }

  const [{ data: profile }, { data: courseAdmin }, { data: courseUser }] = await Promise.all([
    admin.from('profiles').select('is_admin').eq('id', data.user.id).single(),
    admin.from('course_admins').select('id').eq('user_id', data.user.id).eq('course_id', course.id).single(),
    admin.from('crm_course_users').select('id').eq('user_id', data.user.id).eq('course_id', course.id).single(),
  ])

  if (!profile?.is_admin && !courseAdmin && !courseUser) {
    await supabase.auth.signOut()
    return { error: 'You do not have access to this portal' }
  }

  if (courseUser) {
    await admin
      .from('crm_course_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', courseUser.id)
  }

  redirect(`/course/${slug}/reports`)
}
