'use server'

import { createAdminClient } from '@/lib/supabase/admin'

const PASSES_BY_TIER: Record<string, number> = { eagle: 1, ace: 2 }

export async function issueGuestPasses(userId: string, tier: string): Promise<void> {
  const count = PASSES_BY_TIER[tier] ?? 0
  if (count === 0) return

  const admin = createAdminClient()
  const expiresAt = new Date()
  expiresAt.setFullYear(expiresAt.getFullYear() + 1)

  const passes = Array.from({ length: count }, () => ({
    user_id: userId,
    expires_at: expiresAt.toISOString(),
  }))

  await admin.from('guest_passes').insert(passes)
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
