'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const TIER_MULTIPLIER: Record<string, number> = {
  ace: 2,
  eagle: 1.5,
  fairway: 1,
}

export async function searchMembers(query: string) {
  if (!query || query.trim().length < 2) return []

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('id, full_name, email, memberships(tier)')
    .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
    .limit(8)

  return data ?? []
}

export async function getMemberForCheckIn(memberId: string) {
  const admin = createAdminClient()

  const [{ data: profile }, { data: points }] = await Promise.all([
    admin
      .from('profiles')
      .select('id, full_name, email, created_at, memberships(tier, status)')
      .eq('id', memberId)
      .single(),
    admin
      .from('fairway_points')
      .select('amount')
      .eq('user_id', memberId),
  ])

  const balance = (points ?? []).reduce((sum: number, r: any) => sum + r.amount, 0)
  return { profile, balance }
}

export async function logRound({
  memberId,
  courseId,
  greenFee,
  note,
}: {
  memberId: string
  courseId: string
  greenFee: number
  note?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify caller is a course admin
  const { data: admin } = await supabase
    .from('course_admins')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single()
  if (!admin) return { error: 'Not authorized' }

  // Get member tier
  const adminClient = createAdminClient()
  const { data: membership } = await adminClient
    .from('memberships')
    .select('tier')
    .eq('user_id', memberId)
    .single()

  const tier = membership?.tier ?? 'fairway'
  const multiplier = TIER_MULTIPLIER[tier] ?? 1
  const pointsEarned = Math.floor(greenFee * multiplier)

  const { error } = await adminClient.from('fairway_points').insert({
    user_id: memberId,
    course_id: courseId,
    amount: pointsEarned,
    reason: note ? `check-in: ${note}` : 'check-in: round played',
  })

  if (error) return { error: 'Failed to award points. Please try again.' }
  return { success: true, pointsEarned, tier, multiplier }
}
