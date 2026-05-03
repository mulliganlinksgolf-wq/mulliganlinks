'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireManager } from '@/lib/courseRole'

export interface ProfileResult {
  id: string
  full_name: string
}

export async function searchProfiles(
  query: string,
  leagueId: string,
  slug: string,
): Promise<{ results: ProfileResult[]; error?: string }> {
  await requireManager(slug)

  if (!query.trim()) return { results: [] }

  const admin = createAdminClient()

  // Get IDs already in the league so we can exclude them
  const { data: existing } = await admin
    .from('league_members')
    .select('user_id')
    .eq('league_id', leagueId)

  const existingIds = (existing ?? []).map(m => m.user_id)

  const { data, error } = await admin
    .from('profiles')
    .select('id, full_name')
    .ilike('full_name', `%${query.trim()}%`)
    .limit(10)

  if (error) return { results: [], error: error.message }

  const results = (data ?? [])
    .filter(p => p.full_name && !existingIds.includes(p.id))
    .map(p => ({ id: p.id, full_name: p.full_name as string }))

  return { results }
}

export async function addLeagueMember(
  leagueId: string,
  userId: string,
  handicap: number,
  slug: string,
): Promise<{ error?: string }> {
  await requireManager(slug)

  const admin = createAdminClient()
  const { error } = await admin
    .from('league_members')
    .insert({ league_id: leagueId, user_id: userId, handicap })

  if (error) return { error: error.message }
  return {}
}

export async function addGuestMember(
  leagueId: string,
  guestName: string,
  handicap: number,
  slug: string,
): Promise<{ error?: string }> {
  await requireManager(slug)

  const admin = createAdminClient()
  const { error } = await admin
    .from('league_members')
    .insert({ league_id: leagueId, guest_name: guestName.trim(), handicap })

  if (error) return { error: error.message }
  return {}
}
