'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CrmMemberTier, CrmMemberStatus } from '@/lib/crm/types'

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

export async function createCrmMember(
  _: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean; id?: string }> {
  try {
    const admin = await assertAdmin()
    const { data, error } = await admin
      .from('crm_members')
      .insert({
        name: formData.get('name') as string,
        email: (formData.get('email') as string) || null,
        phone: (formData.get('phone') as string) || null,
        membership_tier: ((formData.get('membership_tier') as CrmMemberTier) || 'free'),
        home_course: (formData.get('home_course') as string) || null,
        join_date: (formData.get('join_date') as string) || null,
        lifetime_spend: formData.get('lifetime_spend') ? parseFloat(formData.get('lifetime_spend') as string) : 0,
        status: ((formData.get('status') as CrmMemberStatus) || 'active'),
        notes: (formData.get('notes') as string) || null,
      })
      .select('id')
      .single()

    if (error) return { error: error.message }
    revalidatePath('/admin/crm/members')
    return { success: true, id: data.id }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function updateCrmMember(
  id: string,
  fields: Record<string, unknown>
): Promise<{ error?: string; success?: boolean }> {
  try {
    const admin = await assertAdmin()
    const { error } = await admin
      .from('crm_members')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return { error: error.message }
    revalidatePath(`/admin/crm/members/${id}`)
    revalidatePath('/admin/crm/members')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function deleteCrmMember(id: string): Promise<{ error?: string; success?: boolean }> {
  try {
    const admin = await assertAdmin()
    const { error } = await admin.from('crm_members').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/crm/members')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
