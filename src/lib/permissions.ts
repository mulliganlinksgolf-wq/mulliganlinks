// Server-only module. The createClient import below transitively pulls in
// next/headers, which the Next.js bundler refuses to ship to the client.
// Client components must import constants from @/lib/permission-constants
// instead, see PermissionsEditor for an example.
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  COURSE_PERMISSIONS,
  PERMISSION_LABELS,
  type CoursePermission,
} from '@/lib/permission-constants'

// Re-export so existing server-side callers don't need to change imports.
export { COURSE_PERMISSIONS, PERMISSION_LABELS }
export type { CoursePermission }

export async function hasPermission(
  userId: string,
  courseId: string,
  permission: CoursePermission,
): Promise<boolean> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('user_has_course_permission', {
    p_user_id: userId,
    p_course_id: courseId,
    p_permission: permission,
  })
  if (error) {
    console.error('[hasPermission] rpc error', error)
    return false
  }
  return data === true
}

export async function requirePermission(
  slug: string,
  courseId: string,
  permission: CoursePermission,
): Promise<{ userId: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/course/${slug}/login`)
  const allowed = await hasPermission(user.id, courseId, permission)
  if (!allowed) redirect(`/course/${slug}/unauthorized`)
  return { userId: user.id }
}

export async function getEffectivePermissions(
  userId: string,
  courseId: string,
): Promise<Record<CoursePermission, boolean>> {
  const admin = createAdminClient()
  const results = await Promise.all(
    COURSE_PERMISSIONS.map(async p => {
      const { data } = await admin.rpc('user_has_course_permission', {
        p_user_id: userId,
        p_course_id: courseId,
        p_permission: p,
      })
      return [p, data === true] as const
    }),
  )
  return Object.fromEntries(results) as Record<CoursePermission, boolean>
}
