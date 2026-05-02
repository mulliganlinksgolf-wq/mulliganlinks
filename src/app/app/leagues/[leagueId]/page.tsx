// src/app/app/leagues/[leagueId]/page.tsx
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calcStandingsRank, formatLeagueFormat, type StandingRow } from '@/lib/leagues'

export default async function MemberLeagueDetailPage({
  params,
}: {
  params: Promise<{ leagueId: string }>
}) {
  const { leagueId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: league } = await admin
    .from('leagues')
    .select('id, name, format, status, season_start, season_end, courses(name, slug)')
    .eq('id', leagueId)
    .single()
  if (!league) notFound()

  // Verify user is a member
  const { data: myMembership } = await supabase
    .from('league_members')
    .select('id, handicap, status')
    .eq('league_id', leagueId)
    .eq('user_id', user.id)
    .single()
  if (!myMembership) notFound()

  const [{ data: standingsRaw }, { data: sessions }] = await Promise.all([
    admin
      .from('league_standings')
      .select('league_member_id, user_id, full_name, handicap, rounds_played, avg_net_score, best_net, total_gross')
      .eq('league_id', leagueId),
    admin
      .from('league_sessions')
      .select('id, session_number, session_date, league_scores(league_member_id)')
      .eq('league_id', leagueId)
      .order('session_number'),
  ])

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

  const ranked = calcStandingsRank(standings)
  const myRank = ranked.find(r => r.user_id === user.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const course = league.courses as any

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/leagues" className="text-xs text-[#8FA889] hover:text-white">← My Leagues</Link>
        <h1 className="text-2xl font-bold font-serif text-white italic mt-1">{league.name}</h1>
        <p className="text-sm text-[#8FA889] mt-0.5">
          {course?.name}
          {' · '}
          {formatLeagueFormat(league.format)}
          {' · '}
          {new Date(league.season_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          {' – '}
          {new Date(league.season_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* My standing callout */}
      {myRank && (
        <div className="rounded-xl p-5" style={{ background: '#163d2a' }}>
          <p className="text-[8px] uppercase tracking-widest text-[#8FA889] mb-1">My Standing</p>
          <div className="flex items-end gap-4">
            <div>
              <p className="text-4xl font-bold text-white">#{myRank.rank}</p>
              <p className="text-xs text-[#8FA889] mt-0.5">of {ranked.length} players</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-sm text-white"><span className="text-[#8FA889]">Avg net:</span> {myRank.avg_net_score ?? '—'}</p>
              <p className="text-sm text-white"><span className="text-[#8FA889]">Best net:</span> {myRank.best_net ?? '—'}</p>
              <p className="text-sm text-white"><span className="text-[#8FA889]">Rounds:</span> {myRank.rounds_played}</p>
            </div>
          </div>
        </div>
      )}

      {/* Standings table */}
      <section className="space-y-3">
        <p className="text-[8px] uppercase tracking-widest text-[#aaa]">Standings</p>
        <div className="rounded-xl overflow-hidden" style={{ background: '#163d2a' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#0f2d1d' }}>
                {['Rank', 'Player', 'Rounds', 'Avg Net'].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-[9px] uppercase tracking-widest text-[#8FA889] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ranked.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-[#8FA889] text-sm">No scores posted yet.</td></tr>
              ) : ranked.map(r => (
                <tr
                  key={r.league_member_id}
                  className={`border-t border-[#1d4c36] ${r.user_id === user.id ? 'bg-white/5' : ''}`}
                >
                  <td className="px-4 py-2.5 font-bold text-white">{r.rank}</td>
                  <td className="px-4 py-2.5 text-white font-medium">
                    {r.full_name}
                    {r.user_id === user.id && <span className="ml-1.5 text-[10px] text-[#8FA889]">(you)</span>}
                  </td>
                  <td className="px-4 py-2.5 text-[#8FA889]">{r.rounds_played}</td>
                  <td className="px-4 py-2.5 text-white font-semibold">{r.avg_net_score ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* My rounds history */}
      {sessions && sessions.length > 0 && (
        <section className="space-y-3">
          <p className="text-[8px] uppercase tracking-widest text-[#aaa]">My Rounds</p>
          <div className="space-y-2">
            {sessions.map(sess => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const myScore = (sess.league_scores as any[])?.find(
                (s: any) => s.league_member_id === myMembership.id
              )
              return (
                <div key={sess.id} className="rounded-lg px-4 py-3 flex items-center justify-between" style={{ background: '#163d2a' }}>
                  <div>
                    <p className="text-sm font-medium text-white">Session {sess.session_number}</p>
                    <p className="text-xs text-[#8FA889]">
                      {new Date(sess.session_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right">
                    {myScore ? (
                      <p className="text-xs text-emerald-400">✓ Scored</p>
                    ) : (
                      <p className="text-xs text-[#8FA889]">Pending</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
