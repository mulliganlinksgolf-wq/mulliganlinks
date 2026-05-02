'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { MANAGER_ROLES } from '@/lib/courseRole'

async function assertManager(courseId: string): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles').select('is_admin').eq('id', user.id).single()

  if (profile?.is_admin) return user.id

  const { data: courseAdmin } = await admin
    .from('course_admins')
    .select('role')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single()

  if (!courseAdmin || !MANAGER_ROLES.includes(courseAdmin.role)) {
    throw new Error('Forbidden')
  }
  return user.id
}

export async function inviteStaff(
  email: string,
  courseId: string,
  slug: string,
): Promise<void> {
  await assertManager(courseId)

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://teeahead.com'
  const admin = createAdminClient()
  const { data: invited, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/course/${slug}`,
  })
  if (error) throw new Error(error.message)

  const { error: insertError } = await admin.from('course_admins').upsert(
    { user_id: invited.user.id, course_id: courseId, role: 'staff' },
    { onConflict: 'user_id,course_id', ignoreDuplicates: true },
  )
  if (insertError) throw new Error(insertError.message)

  revalidatePath(`/course/${slug}/settings/team`)
}

export async function removeStaff(
  targetUserId: string,
  courseId: string,
  slug: string,
): Promise<void> {
  await assertManager(courseId)

  const admin = createAdminClient()
  const { error } = await admin
    .from('course_admins')
    .delete()
    .eq('user_id', targetUserId)
    .eq('course_id', courseId)
    .eq('role', 'staff')

  if (error) throw new Error(error.message)
  revalidatePath(`/course/${slug}/settings/team`)
}

export async function updateMemberRole(
  targetUserId: string,
  courseId: string,
  slug: string,
  newRole: 'owner' | 'manager' | 'staff',
): Promise<void> {
  await assertManager(courseId)

  const admin = createAdminClient()
  const { error } = await admin
    .from('course_admins')
    .update({ role: newRole })
    .eq('user_id', targetUserId)
    .eq('course_id', courseId)

  if (error) throw new Error(error.message)
  revalidatePath(`/course/${slug}/settings/team`)
}

export async function resendInvite(
  email: string,
  courseId: string,
  slug: string,
): Promise<void> {
  await assertManager(courseId)

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://teeahead.com'
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/course/${slug}`,
  })
  if (error) throw new Error(error.message)

  revalidatePath(`/course/${slug}/settings/team`)
}
