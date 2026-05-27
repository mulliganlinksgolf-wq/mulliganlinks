'use server'

import { createAdminClient } from '@/lib/supabase/admin'

const BIRTHDAY_CREDIT_CENTS: Record<string, number> = { eagle: 1000, ace: 2000 }

export async function issueIfBirthdayToday(userId: string, tier: string): Promise<void> {
  const amount = BIRTHDAY_CREDIT_CENTS[tier] ?? 0
  if (amount === 0) return

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('birthday')
    .eq('id', userId)
    .single()

  if (!profile?.birthday) return

  const today = new Date()
  const bday = new Date(profile.birthday)
  if (bday.getMonth() !== today.getMonth() || bday.getDate() !== today.getDate()) return

  const period = today.toISOString().split('T')[0] // YYYY-MM-DD
  const expiresAt = new Date(today)
  expiresAt.setFullYear(expiresAt.getFullYear() + 1)

  await admin.from('member_credits').upsert(
    {
      user_id: userId,
      type: 'birthday',
      amount_cents: amount,
      period,
      status: 'available',
      expires_at: expiresAt.toISOString(),
    },
    { onConflict: 'user_id,type,period', ignoreDuplicates: true },
  )
}
