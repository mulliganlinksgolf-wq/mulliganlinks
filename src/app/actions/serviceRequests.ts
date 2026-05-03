'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function toggleServiceRequests(
  courseId: string,
  enabled: boolean,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()
  const [{ data: adminRow }, { data: crmRow }] = await Promise.all([
    admin.from('course_admins').select('id').eq('course_id', courseId).eq('user_id', user.id).maybeSingle(),
    admin.from('crm_course_users').select('id').eq('course_id', courseId).eq('user_id', user.id).maybeSingle(),
  ])
  if (!adminRow && !crmRow) return { error: 'Not authorized' }

  const { error } = await admin
    .from('courses')
    .update({ service_requests_enabled: enabled, updated_at: new Date().toISOString() })
    .eq('id', courseId)

  if (error) return { error: error.message }
  revalidatePath('/app')
  return {}
}
