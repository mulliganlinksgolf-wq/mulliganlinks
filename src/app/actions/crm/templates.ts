'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CrmRecordType } from '@/lib/crm/types'

const ADMIN_EMAILS = ['mulliganlinksgolf@gmail.com', 'nbarris11@gmail.com', 'beslock@yahoo.com']

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!ADMIN_EMAILS.includes(user.email ?? '') && !profile?.is_admin) throw new Error('Not authorized')
  return admin
}

export async function createEmailTemplate(
  _: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    const admin = await assertAdmin()
    const { error } = await admin.from('crm_email_templates').insert({
      name: formData.get('name') as string,
      subject: formData.get('subject') as string,
      body_html: formData.get('body_html') as string,
      record_type: formData.get('record_type') as CrmRecordType,
    })
    if (error) return { error: error.message }
    revalidatePath('/admin/crm/email-templates')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function updateEmailTemplate(
  id: string,
  fields: { name?: string; subject?: string; body_html?: string; record_type?: CrmRecordType }
): Promise<{ error?: string; success?: boolean }> {
  try {
    const admin = await assertAdmin()
    const { error } = await admin
      .from('crm_email_templates')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/crm/email-templates')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function deleteEmailTemplate(id: string): Promise<{ error?: string; success?: boolean }> {
  try {
    const admin = await assertAdmin()
    const { error } = await admin.from('crm_email_templates').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/crm/email-templates')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
