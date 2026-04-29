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

export async function saveBlock(formData: FormData) {
  const key = formData.get('key') as string
  const value = formData.get('value') as string
  const group = (formData.get('group') as string) ?? key.split('.')[0]
  const { admin, user } = await assertAdmin()
  const { data: existing } = await admin
    .from('content_blocks')
    .select('value')
    .eq('key', key)
    .single()
  const { error: updateError } = await admin
    .from('content_blocks')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('key', key)
  if (updateError) throw new Error(`Failed to save content block: ${updateError.message}`)
  await writeAuditLog({
    eventType: 'content_edited',
    targetType: 'content',
    targetId: key,
    targetLabel: key,
    details: { old_value: existing?.value ?? null, new_value: value, by: user.email },
  })
  revalidatePath('/', 'layout')
  redirect(`/admin/content?group=${group}&saved=1`)
}

export async function addBlock(
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const key = (formData.get('key') as string).trim()
  const value = (formData.get('value') as string) ?? ''
  const type = (formData.get('type') as string) || 'text'
  const description = (formData.get('description') as string) ?? ''

  if (!key) return { error: 'Key is required.' }
  if (!/^[a-z0-9_]+\.[a-z0-9_]+$/.test(key)) return { error: 'Key must be in format group.block (lowercase, underscores only).' }

  const group = key.split('.')[0]
  const { admin } = await assertAdmin()
  const { error: insertError } = await admin.from('content_blocks').insert({
    key,
    value,
    type,
    description,
    updated_at: new Date().toISOString(),
  })
  if (insertError) {
    if (insertError.code === '23505') return { error: 'A block with that key already exists.' }
    return { error: `Failed to add block: ${insertError.message}` }
  }
  revalidatePath('/', 'layout')
  redirect(`/admin/content?group=${group}&saved=1`)
}
