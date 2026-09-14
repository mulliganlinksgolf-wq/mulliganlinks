'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, type CoursePermission } from '@/lib/permissions'
import { writeAuditLog } from '@/lib/audit'

export async function togglePermissionAction(params: {
  courseId: string
  slug: string
  userId: string
  permission: CoursePermission
  granted: boolean
}) {
  try {
    const { userId: actorId } = await requirePermission(
      params.slug,
      params.courseId,
      'manage_staff',
    )

    const admin = createAdminClient()
    const { error } = await admin.from('staff_permissions').upsert(
      {
        course_id: params.courseId,
        user_id: params.userId,
        permission: params.permission,
        granted: params.granted,
        granted_by: actorId,
      },
      { onConflict: 'course_id,user_id,permission' },
    )
    if (error) throw new Error(error.message)

    await writeAuditLog({
      eventType: 'permission_changed',
      targetType: 'staff_permission',
      targetId: params.userId,
      details: {
        course_id: params.courseId,
        permission: params.permission,
        granted: params.granted,
      },
    })

    revalidatePath(`/course/${params.slug}/settings/team`)
    return { ok: true as const }
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? (e instanceof Error ? e.message : String(e)) : 'unknown_error',
    }
  }
}

export async function resetPermissionToDefaultAction(params: {
  courseId: string
  slug: string
  userId: string
  permission: CoursePermission
}) {
  try {
    const { userId: actorId } = await requirePermission(
      params.slug,
      params.courseId,
      'manage_staff',
    )

    const admin = createAdminClient()
    const { error } = await admin
      .from('staff_permissions')
      .delete()
      .eq('course_id', params.courseId)
      .eq('user_id', params.userId)
      .eq('permission', params.permission)
    if (error) throw new Error(error.message)

    await writeAuditLog({
      eventType: 'permission_changed',
      targetType: 'staff_permission',
      targetId: params.userId,
      details: {
        course_id: params.courseId,
        permission: params.permission,
        reset_to_default: true,
        by: actorId,
      },
    })

    revalidatePath(`/course/${params.slug}/settings/team`)
    return { ok: true as const }
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? (e instanceof Error ? e.message : String(e)) : 'unknown_error',
    }
  }
}
