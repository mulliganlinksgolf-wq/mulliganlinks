import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export const MANAGER_ROLES = ['owner', 'manager']

export interface CourseRoleContext {
  userId: string
  courseId: string
  role: string
  isGlobalAdmin: boolean
  isManager: boolean
}

export async function resolveCourseRole(slug: string): Promise<CourseRoleContext> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/course/${slug}/login`)

  const admin = createAdminClient()
  const { data: course } = await admin
    .from('courses')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!course) redirect(`/course/${slug}/login`)

  const [
    { data: profile },
    { data: courseAdmin },
    { data: courseUser },
  ] = await Promise.all([
    admin.from('profiles').select('is_admin').eq('id', user.id).single(),
    admin.from('course_admins').select('role').eq('user_id', user.id).eq('course_id', course.id).single(),
    admin.from('crm_course_users').select('role').eq('user_id', user.id).eq('course_id', course.id).single(),
  ])

  const isGlobalAdmin = profile?.is_admin === true
  if (!isGlobalAdmin && !courseAdmin && !courseUser) redirect(`/course/${slug}/login`)

  const role = isGlobalAdmin ? 'owner' : (courseAdmin?.role ?? courseUser?.role ?? 'staff')
  const isManager = isGlobalAdmin || MANAGER_ROLES.includes(role)

  return { userId: user.id, courseId: course.id, role, isGlobalAdmin, isManager }
}

export async function requireManager(slug: string): Promise<CourseRoleContext> {
  const ctx = await resolveCourseRole(slug)
  if (!ctx.isManager) redirect(`/course/${slug}/unauthorized`)
  return ctx
}
