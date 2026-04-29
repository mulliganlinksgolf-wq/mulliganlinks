'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function activateCoursePartner(
  formData: FormData,
  token: string,
  slug: string,
): Promise<{ error: string }> {
  const password = formData.get('password') as string
  const confirm = formData.get('confirm') as string

  if (password !== confirm) return { error: 'Passwords do not match' }
  if (password.length < 8) return { error: 'Password must be at least 8 characters' }

  const admin = createAdminClient()
  const { data: invite } = await admin
    .from('crm_course_users')
    .select('id, email, setup_token_expires_at')
    .eq('setup_token', token)
    .is('user_id', null)
    .single()

  if (!invite) return { error: 'Invalid setup link' }
  if (new Date(invite.setup_token_expires_at) < new Date()) {
    return { error: 'This setup link has expired — contact your TeeAhead account manager to resend' }
  }

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: invite.email,
    password,
    email_confirm: true,
  })

  if (authError?.message?.includes('already registered')) {
    return { error: 'An account with this email already exists. Try logging in instead.' }
  }
  if (authError || !authData.user) {
    return { error: authError?.message ?? 'Failed to create account. Please try again.' }
  }

  await admin
    .from('crm_course_users')
    .update({
      user_id: authData.user.id,
      setup_token: null,
      setup_token_expires_at: null,
      last_login_at: new Date().toISOString(),
    })
    .eq('id', invite.id)

  const supabase = await createClient()
  await supabase.auth.signInWithPassword({ email: invite.email, password })

  redirect(`/course/${slug}/reports`)
}
