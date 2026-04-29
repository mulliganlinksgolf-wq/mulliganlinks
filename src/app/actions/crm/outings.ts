'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CrmOutingStatus } from '@/lib/crm/types'

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

export async function createOuting(
  _: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean; id?: string }> {
  try {
    const admin = await assertAdmin()
    const { data, error } = await admin
      .from('crm_outings')
      .insert({
        contact_name: formData.get('contact_name') as string,
        contact_email: (formData.get('contact_email') as string) || null,
        contact_phone: (formData.get('contact_phone') as string) || null,
        event_date: (formData.get('event_date') as string) || null,
        num_golfers: formData.get('num_golfers') ? parseInt(formData.get('num_golfers') as string, 10) : null,
        preferred_course: (formData.get('preferred_course') as string) || null,
        budget_estimate: formData.get('budget_estimate') ? parseFloat(formData.get('budget_estimate') as string) : null,
        status: ((formData.get('status') as CrmOutingStatus) || 'lead'),
        assigned_to: (formData.get('assigned_to') as string) || null,
        notes: (formData.get('notes') as string) || null,
      })
      .select('id')
      .single()

    if (error) return { error: error.message }
    revalidatePath('/admin/crm/outings')
    return { success: true, id: data.id }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function updateOuting(
  id: string,
  fields: Record<string, unknown>
): Promise<{ error?: string; success?: boolean }> {
  try {
    const admin = await assertAdmin()
    const { error } = await admin
      .from('crm_outings')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return { error: error.message }
    revalidatePath(`/admin/crm/outings/${id}`)
    revalidatePath('/admin/crm/outings')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function deleteOuting(id: string): Promise<{ error?: string; success?: boolean }> {
  try {
    const admin = await assertAdmin()
    const { error } = await admin.from('crm_outings').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/crm/outings')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
