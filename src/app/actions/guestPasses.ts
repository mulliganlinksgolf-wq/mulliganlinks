// Imported only by server pages and the verified Stripe webhook. Do not expose
// privileged pass issuance as a browser-callable Server Action.
import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

export async function issueGuestPasses(userId: string, tier: string, subscriptionId: string, periodEnd: string): Promise<void> {
  const { error } = await createAdminClient().rpc('issue_membership_guest_passes', {
    p_user_id: userId, p_tier: tier, p_subscription_id: subscriptionId, p_period_end: periodEnd,
  })
  if (error) throw error
}

export async function getAvailablePasses(userId: string): Promise<{ id: string; expires_at: string }[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('guest_passes')
    .select('id, expires_at')
    .eq('user_id', userId)
    .is('redeemed_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('expires_at')

  return data ?? []
}
