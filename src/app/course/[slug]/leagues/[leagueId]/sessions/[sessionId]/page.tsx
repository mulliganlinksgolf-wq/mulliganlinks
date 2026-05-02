// src/app/course/[slug]/leagues/[leagueId]/sessions/[sessionId]/page.tsx
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireManager } from '@/lib/courseRole'
import ScoreEntryClient, { type InitialMember } from './ScoreEntryClient'

export default async function ScoreEntryPage({
  params,
}: {
  params: Promise<{ slug: string; leagueId: string; sessionId: string }>
}) {
  const { slug, leagueId, sessionId } = await params
  await requireManager(slug)

  const admin = createAdminClient()

  const [
    { data: sess },
    { data: members },
    { data: existingScores },
    { data: league },
  ] = await Promise.all([
    admin.from('league_sessions').select('session_number, session_date, notes').eq('id', sessionId).single(),
    admin
      .from('league_members')
      .select('id, handicap, profiles(full_name)')
      .eq('league_id', leagueId)
      .eq('status', 'active'),
    admin.from('league_scores').select('league_member_id, gross_score, handicap_strokes').eq('session_id', sessionId),
    admin.from('leagues').select('name').eq('id', leagueId).single(),
  ])

  if (!sess || !league) notFound()

  const scoreMap = new Map(
    (existingScores ?? []).map(s => [s.league_member_id, s])
  )

  const initialMembers: InitialMember[] = (members ?? [])
    .map(m => {
      const existing = scoreMap.get(m.id)
      return {
        league_member_id: m.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        full_name: (m.profiles as any)?.full_name ?? '—',
        handicap: m.handicap,
        gross_score: existing ? String(existing.gross_score) : '',
        handicap_strokes: existing ? String(existing.handicap_strokes) : String(m.handicap),
      }
    })
    .sort((a, b) => a.full_name.localeCompare(b.full_name))

  return (
    <ScoreEntryClient
      slug={slug}
      leagueId={leagueId}
      sessionId={sessionId}
      leagueName={league.name ?? ''}
      sessionNumber={sess.session_number}
      sessionDate={sess.session_date}
      sessionNotes={sess.notes}
      initialMembers={initialMembers}
    />
  )
}
