// src/app/actions/crm/courses.ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CrmCourseStage } from '@/lib/crm/types'

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

export async function createCourse(
  _: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean; id?: string }> {
  try {
    const admin = await assertAdmin()
    const { data, error } = await admin
      .from('crm_courses')
      .insert({
        name: formData.get('name') as string,
        address: (formData.get('address') as string) || null,
        city: (formData.get('city') as string) || null,
        state: (formData.get('state') as string) || null,
        zip: (formData.get('zip') as string) || null,
        contact_name: (formData.get('contact_name') as string) || null,
        contact_email: (formData.get('contact_email') as string) || null,
        contact_phone: (formData.get('contact_phone') as string) || null,
        stage: ((formData.get('stage') as CrmCourseStage) || 'lead'),
        assigned_to: (formData.get('assigned_to') as string) || null,
        notes: (formData.get('notes') as string) || null,
        estimated_value: formData.get('estimated_value')
          ? parseFloat(formData.get('estimated_value') as string)
          : null,
      })
      .select('id')
      .single()

    if (error) return { error: error.message }
    revalidatePath('/admin/crm/courses')
    return { success: true, id: data.id }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function updateCourse(
  id: string,
  fields: Partial<{
    name: string
    address: string | null
    city: string | null
    state: string | null
    zip: string | null
    contact_name: string | null
    contact_email: string | null
    contact_phone: string | null
    stage: CrmCourseStage
    assigned_to: string | null
    notes: string | null
    estimated_value: number | null
  }>
): Promise<{ error?: string; success?: boolean }> {
  try {
    const admin = await assertAdmin()
    const { error } = await admin
      .from('crm_courses')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return { error: error.message }
    revalidatePath(`/admin/crm/courses/${id}`)
    revalidatePath('/admin/crm/courses')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function updateCourseStage(
  id: string,
  stage: CrmCourseStage
): Promise<{ error?: string; success?: boolean }> {
  try {
    const admin = await assertAdmin()
    const { error } = await admin
      .from('crm_courses')
      .update({ stage, last_activity_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return { error: error.message }
    revalidatePath('/admin/crm/courses')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function deleteCourse(id: string): Promise<{ error?: string; success?: boolean }> {
  try {
    const admin = await assertAdmin()
    const { error } = await admin.from('crm_courses').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/crm/courses')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
