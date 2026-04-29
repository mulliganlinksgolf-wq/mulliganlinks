import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAILS = ['mulliganlinksgolf@gmail.com', 'nbarris11@gmail.com', 'beslock@yahoo.com']

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  if (!ADMIN_EMAILS.includes(user.email ?? '')) {
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    if (!profile?.is_admin) redirect('/app')
  }

  return user
}
