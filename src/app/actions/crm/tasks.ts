'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CrmAssignee, CrmRecordType } from '@/lib/crm/types'

const ADMIN_EMAILS = ['mulliganlinksgolf@gmail.com', 'neil@teeahead.com', 'beslock@yahoo.com']

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    throw new Error('Unauthorized')
  }
}

export interface CreateTaskInput {
  title: string
  notes?: string | null
  record_type?: CrmRecordType | null
  record_id?: string | null
  assigned_to: CrmAssignee
  due_date?: string | null
}

export async function createTask(input: CreateTaskInput) {
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await admin.from('crm_tasks').insert({
    title: input.title,
    notes: input.notes ?? null,
    record_type: input.record_type ?? null,
    record_id: input.record_id ?? null,
    assigned_to: input.assigned_to,
    due_date: input.due_date ?? null,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/crm')
  revalidatePath('/admin/crm/tasks')
  if (input.record_type && input.record_id) {
    revalidatePath(`/admin/crm/${input.record_type}s/${input.record_id}`)
  }
}

export async function completeTask(id: string) {
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await admin
    .from('crm_tasks')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/crm')
  revalidatePath('/admin/crm/tasks')
}

export async function uncompleteTask(id: string) {
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await admin
    .from('crm_tasks')
    .update({ completed_at: null })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/crm')
  revalidatePath('/admin/crm/tasks')
}

export async function deleteTask(id: string) {
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await admin.from('crm_tasks').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/crm')
  revalidatePath('/admin/crm/tasks')
}

export async function updateTaskDueDate(id: string, due_date: string | null) {
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await admin.from('crm_tasks').update({ due_date }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/crm/tasks')
}
