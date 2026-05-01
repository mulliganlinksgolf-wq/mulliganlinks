'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function pauseMembership(months: 1 | 2): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const pauseUntil = new Date()
  pauseUntil.setMonth(pauseUntil.getMonth() + months)

  const admin = createAdminClient()
  const { error } = await admin
    .from('memberships')
    .update({ paused_until: pauseUntil.toISOString() })
    .eq('user_id', user.id)
    .in('tier', ['eagle', 'ace'])
    .eq('status', 'active')

  if (error) throw new Error('Failed to pause membership: ' + error.message)
  revalidatePath('/app/billing')
}

export async function resumeMembership(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const admin = createAdminClient()
  const { error } = await admin
    .from('memberships')
    .update({ paused_until: null })
    .eq('user_id', user.id)

  if (error) throw new Error('Failed to resume membership: ' + error.message)
  revalidatePath('/app/billing')
}

export async function cancelMembership(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const admin = createAdminClient()
  const { error } = await admin
    .from('memberships')
    .update({
      cancel_at_period_end: true,
      canceled_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)

  if (error) throw new Error('Failed to cancel membership: ' + error.message)
  revalidatePath('/app/billing')
}
