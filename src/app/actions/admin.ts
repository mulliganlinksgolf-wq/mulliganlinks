'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const ADMIN_EMAILS = ['mulliganlinksgolf@gmail.com', 'nbarris11@gmail.com', 'beslock@yahoo.com']

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!ADMIN_EMAILS.includes(user.email ?? '') && !profile?.is_admin) {
    throw new Error('Not authorized')
  }

  return admin
}

// ─── Create a new member account ────────────────────────────────────────────

export async function createMember(prevState: { error?: string; success?: boolean }, formData: FormData) {
  try {
    const admin = await assertAdmin()

    const name = (formData.get('name') as string).trim()
    const email = (formData.get('email') as string).trim().toLowerCase()
    const password = formData.get('password') as string
    const tier = (formData.get('tier') as string) || 'fairway'
    const makeAdmin = formData.get('is_admin') === 'true'

    if (!name || !email || !password) return { error: 'Name, email, and password are required.' }
    if (password.length < 8) return { error: 'Password must be at least 8 characters.' }

    // Create auth user (email pre-confirmed so they can log in immediately)
    const { data: created, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    })

    if (authError) return { error: authError.message }

    const userId = created.user.id

    // Give the DB trigger a moment to create the profile row
    await new Promise(r => setTimeout(r, 500))

    // Upsert profile (trigger may have already done this)
    await admin.from('profiles').upsert({
      id: userId,
      full_name: name,
      email,
      ...(makeAdmin ? { is_admin: true } : {}),
    })

    // Set tier (upsert membership)
    const { data: existing } = await admin
      .from('memberships')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existing) {
      await admin.from('memberships').update({ tier, status: 'active' }).eq('user_id', userId)
    } else {
      await admin.from('memberships').insert({ user_id: userId, tier, status: 'active' })
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (e: any) {
    return { error: e.message ?? 'Something went wrong.' }
  }
}

// ─── Toggle admin status ─────────────────────────────────────────────────────

export async function setAdminStatus(userId: string, isAdmin: boolean) {
  await assertAdmin()
  const admin = createAdminClient()
  const { error } = await admin.from('profiles').update({ is_admin: isAdmin }).eq('id', userId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/users')
}

// ─── Change membership tier ──────────────────────────────────────────────────

export async function setMemberTier(userId: string, tier: string) {
  await assertAdmin()
  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('memberships')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (existing) {
    await admin.from('memberships').update({ tier, status: 'active' }).eq('user_id', userId)
  } else {
    await admin.from('memberships').insert({ user_id: userId, tier, status: 'active' })
  }

  revalidatePath('/admin/users')
}

// ─── Delete a member account ─────────────────────────────────────────────────

export async function deleteMember(userId: string) {
  await assertAdmin()
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/users')
}
