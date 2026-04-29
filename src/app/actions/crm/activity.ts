'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CrmActivityType, CrmRecordType } from '@/lib/crm/types'

const ADMIN_EMAILS = ['mulliganlinksgolf@gmail.com', 'nbarris11@gmail.com', 'beslock@yahoo.com']

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!ADMIN_EMAILS.includes(user.email ?? '') && !profile?.is_admin) throw new Error('Not authorized')
  return { admin, user }
}

export async function logActivity(
  recordType: CrmRecordType,
  recordId: string,
  type: CrmActivityType,
  body: string,
  createdBy: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    const { admin } = await assertAdmin()
    const { error } = await admin.from('crm_activity_log').insert({
      record_type: recordType,
      record_id: recordId,
      type,
      body: body || null,
      created_by: createdBy,
    })
    if (error) return { error: error.message }

    const table =
      recordType === 'course' ? 'crm_courses'
      : recordType === 'outing' ? 'crm_outings'
      : 'crm_members'

    if (recordType !== 'member') {
      await admin
        .from(table)
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', recordId)
    }

    const segment = recordType === 'course' ? 'courses' : recordType === 'outing' ? 'outings' : 'members'
    revalidatePath(`/admin/crm/${segment}/${recordId}`)
    revalidatePath('/admin/crm')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function getActivityLog(recordType: CrmRecordType, recordId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('crm_activity_log')
    .select('*')
    .eq('record_type', recordType)
    .eq('record_id', recordId)
    .order('created_at', { ascending: false })
  return data ?? []
}
