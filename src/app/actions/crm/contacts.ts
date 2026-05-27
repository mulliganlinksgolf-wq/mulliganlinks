'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const ADMIN_EMAILS = ['mulliganlinksgolf@gmail.com', 'neil@teeahead.com', 'beslock@yahoo.com']

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    throw new Error('Unauthorized')
  }
}

export interface CreateContactInput {
  course_id: string
  name: string
  role?: string | null
  email?: string | null
  phone?: string | null
  is_primary?: boolean
  notes?: string | null
}

export async function createCourseContact(input: CreateContactInput) {
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await admin.from('crm_course_contacts').insert({
    course_id: input.course_id,
    name: input.name,
    role: input.role ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    is_primary: input.is_primary ?? false,
    notes: input.notes ?? null,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/crm/courses/${input.course_id}`)
}

export async function updateCourseContact(id: string, course_id: string, patch: Partial<CreateContactInput>) {
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await admin.from('crm_course_contacts').update(patch).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/crm/courses/${course_id}`)
}

export async function deleteCourseContact(id: string, course_id: string) {
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await admin.from('crm_course_contacts').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/crm/courses/${course_id}`)
}
