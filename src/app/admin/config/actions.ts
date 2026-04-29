'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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

export async function saveConfigValue(formData: FormData) {
  const key = formData.get('key') as string
  const value = formData.get('value') as string
  const { admin, user } = await assertAdmin()
  const { data: existing } = await admin.from('site_config').select('value').eq('key', key).single()
  await admin.from('site_config').update({ value, updated_at: new Date().toISOString() }).eq('key', key)
  await writeAuditLog({
    eventType: 'config_changed',
    targetType: 'config',
    targetId: key,
    targetLabel: key,
    details: { old_value: existing?.value ?? null, new_value: value, by: user.email },
  })
  revalidatePath('/', 'layout')
  revalidatePath('/admin')
  redirect('/admin/config?saved=1')
}
