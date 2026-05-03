// src/app/course/[slug]/leagues/[leagueId]/page.tsx
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireManager } from '@/lib/courseRole'
import LeagueDetailClient from './LeagueDetailClient'
import type { StandingRow } from '@/lib/leagues'

export default async function LeagueDetailPage({
  params,
}: {
  params: Promise<{ slug: string; leagueId: string }>
}) {
  const { slug, leagueId } = await params
  await requireManager(slug)

  const admin = createAdminClient()

  const { data: league } = await admin
    .from('leagues')
    .select('id, name, format, holes, status, season_start, season_end, max_players, notes')
    .eq('id', leagueId)
    .single()
  if (!league) notFound()

  const [
    { data: rawMembers },
    { data: sessions },
    { data: standingsRaw },
  ] = await Promise.all([
    admin
      .from('league_members')
      .select('id, user_id, guest_name, handicap, joined_at, status, profiles(full_name)')
      .eq('league_id', leagueId)
      .order('joined_at'),
    admin
      .from('league_sessions')
      .select('id, session_number, session_date, notes')
      .eq('league_id', leagueId)
      .order('session_number'),
    admin
      .from('league_standings')
      .select('league_member_id, user_id, full_name, handicap, rounds_played, avg_net_score, best_net, total_gross')
      .eq('league_id', leagueId),
  ])

  const members = (rawMembers ?? []).map(m => ({
    id: m.id,
    user_id: m.user_id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    full_name: (m.profiles as any)?.full_name ?? (m as any).guest_name ?? '—',
    handicap: m.handicap,
    status: m.status,
    joined_at: m.joined_at,
  }))

  const standings: StandingRow[] = (standingsRaw ?? []).map(r => ({
    league_member_id: r.league_member_id,
    user_id: r.user_id,
    full_name: r.full_name ?? '—',
    handicap: r.handicap ?? 0,
    rounds_played: Number(r.rounds_played ?? 0),
    avg_net_score: r.avg_net_score != null ? Number(r.avg_net_score) : null,
    best_net: r.best_net != null ? Number(r.best_net) : null,
    total_gross: r.total_gross != null ? Number(r.total_gross) : null,
  }))

  return (
    <LeagueDetailClient
      slug={slug}
      league={league}
      members={members}
      sessions={sessions ?? []}
      standings={standings}
    />
  )
}
