// src/app/app/leagues/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatLeagueFormat, formatLeagueStatus } from '@/lib/leagues'

export default async function MemberLeaguesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: memberships } = await supabase
    .from('league_members')
    .select('id, handicap, status, joined_at, leagues(id, name, format, status, season_start, season_end, courses(name))')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })

  // Filter out memberships where the nested league join is null
  // (RLS blocks draft leagues from being visible to members via league_members join)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const validMemberships = (memberships ?? []).filter((m: any) => m.leagues != null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const active = validMemberships.filter((m: any) => m.status === 'active' && m.leagues?.status !== 'completed')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const past   = validMemberships.filter((m: any) => m.status !== 'active' || m.leagues?.status === 'completed')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LeagueCard = ({ m }: { m: any }) => {
    const l = m.leagues
    return (
      <Link
        href={`/app/leagues/${l.id}`}
        className="block bg-[#163d2a] rounded-xl p-4 hover:bg-[#1a4830] transition-colors"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-white text-sm">{l.name}</p>
            <p className="text-xs text-[#8FA889] mt-0.5">{l.courses?.name}</p>
            <p className="text-xs text-[#8FA889] mt-1">
              {formatLeagueFormat(l.format)}
              {' · '}
              {new Date(l.season_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {' – '}
              {new Date(l.season_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium mt-0.5 ${
            l.status === 'active' ? 'bg-emerald-900 text-emerald-300' : 'bg-gray-700 text-gray-400'
          }`}>
            {formatLeagueStatus(l.status)}
          </span>
        </div>
        <div className="mt-3 text-xs text-[#8FA889]">Handicap: {m.handicap} · View standings →</div>
      </Link>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#aaa] font-sans mb-1">My Leagues</p>
        <h1 className="text-2xl font-bold font-serif text-white italic">Your leagues.</h1>
      </div>

      {validMemberships.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ background: '#163d2a' }}>
          <p className="text-4xl mb-3">🏆</p>
          <p className="font-semibold text-white">Not in any leagues yet</p>
          <p className="text-sm text-[#8FA889] mt-1">Ask your course to add you to a league.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <section className="space-y-3">
              <p className="text-[8px] uppercase tracking-widest text-[#aaa]">Active</p>
              {active.map(m => <LeagueCard key={m.id} m={m} />)}
            </section>
          )}
          {past.length > 0 && (
            <section className="space-y-3">
              <p className="text-[8px] uppercase tracking-widest text-[#aaa]">Past / Withdrawn</p>
              {past.map(m => <LeagueCard key={m.id} m={m} />)}
            </section>
          )}
        </div>
      )}
    </div>
  )
}
