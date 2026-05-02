// src/app/course/[slug]/leagues/[leagueId]/LeagueDetailClient.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { calcStandingsRank, type StandingRow } from '@/lib/leagues'

interface Member {
  id: string
  user_id: string
  full_name: string
  handicap: number
  status: string
  joined_at: string
}

interface Session {
  id: string
  session_number: number
  session_date: string
  notes: string | null
}

interface Props {
  slug: string
  league: {
    id: string
    name: string
    format: string
    status: string
    season_start: string
    season_end: string
    max_players: number
    notes: string | null
  }
  members: Member[]
  sessions: Session[]
  standings: StandingRow[]
}

export default function LeagueDetailClient({ slug, league, members, sessions, standings }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [tab, setTab] = useState<'roster' | 'sessions' | 'standings'>('roster')
  const [addSessionDate, setAddSessionDate] = useState('')
  const [addSessionNotes, setAddSessionNotes] = useState('')
  const [addingSession, setAddingSession] = useState(false)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)

  const ranked = calcStandingsRank(standings)

  async function handleAddSession(e: React.FormEvent) {
    e.preventDefault()
    setAddingSession(true)
    setSessionError(null)
    const nextNumber = (sessions.length > 0 ? Math.max(...sessions.map(s => s.session_number)) : 0) + 1
    const { error } = await supabase.from('league_sessions').insert({
      league_id: league.id,
      session_number: nextNumber,
      session_date: addSessionDate,
      notes: addSessionNotes.trim() || null,
    })
    if (error) {
      setSessionError(error.message)
    } else {
      setAddSessionDate('')
      setAddSessionNotes('')
      router.refresh()
    }
    setAddingSession(false)
  }

  async function handleStatusChange(newStatus: string) {
    setStatusLoading(true)
    await supabase.from('leagues').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', league.id)
    setStatusLoading(false)
    router.refresh()
  }

  const tabClass = (t: string) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      tab === t
        ? 'border-[#1B4332] text-[#1B4332]'
        : 'border-transparent text-[#6B7770] hover:text-[#1A1A1A]'
    }`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href={`/course/${slug}/leagues`} className="text-sm text-[#6B7770] hover:text-[#1A1A1A]">← Leagues</Link>
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mt-1">{league.name}</h1>
          <p className="text-sm text-[#6B7770]">
            {league.format === 'stroke_play' ? 'Stroke Play' : 'Stableford'}
            {' · '}
            {new Date(league.season_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {' – '}
            {new Date(league.season_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            {' · '}
            {members.filter(m => m.status === 'active').length}/{league.max_players} players
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#6B7770]">Status:</span>
          <select
            className="border border-gray-200 rounded-md px-3 py-1.5 text-sm bg-white"
            value={league.status}
            onChange={e => handleStatusChange(e.target.value)}
            disabled={statusLoading}
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-0">
        <button className={tabClass('roster')}    onClick={() => setTab('roster')}>Roster ({members.filter(m=>m.status==='active').length})</button>
        <button className={tabClass('sessions')}  onClick={() => setTab('sessions')}>Sessions ({sessions.length})</button>
        <button className={tabClass('standings')} onClick={() => setTab('standings')}>Standings</button>
      </div>

      {/* ROSTER TAB */}
      {tab === 'roster' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Name', 'Handicap', 'Joined', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-[#6B7770] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {members.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-[#6B7770]">No members yet. Members can join via the TeeAhead app.</td></tr>
                ) : members.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-[#1A1A1A]">{m.full_name}</td>
                    <td className="px-4 py-2.5 text-[#6B7770]">{m.handicap}</td>
                    <td className="px-4 py-2.5 text-[#6B7770]">{new Date(m.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SESSIONS TAB */}
      {tab === 'sessions' && (
        <div className="space-y-4">
          {/* Add session form */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-[#1A1A1A] mb-4">Add Session</h2>
            <form onSubmit={handleAddSession} className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label>Date</Label>
                <Input type="date" value={addSessionDate} onChange={e => setAddSessionDate(e.target.value)} required className="w-40" />
              </div>
              <div className="space-y-1 flex-1 min-w-48">
                <Label>Notes (optional)</Label>
                <Input value={addSessionNotes} onChange={e => setAddSessionNotes(e.target.value)} placeholder="e.g. Back 9, shotgun start" />
              </div>
              <Button type="submit" disabled={addingSession} className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-[#FAF7F2]">
                {addingSession ? 'Adding...' : '+ Add'}
              </Button>
            </form>
            {sessionError && <p className="text-sm text-red-600 mt-2">{sessionError}</p>}
          </div>

          {/* Sessions list */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['#', 'Date', 'Notes', ''].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-[#6B7770] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessions.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-[#6B7770]">No sessions yet.</td></tr>
                ) : sessions.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-[#1A1A1A]">{s.session_number}</td>
                    <td className="px-4 py-2.5 text-[#6B7770]">
                      {new Date(s.session_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-2.5 text-[#6B7770]">{s.notes ?? '—'}</td>
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/course/${slug}/leagues/${league.id}/sessions/${s.id}`}
                        className="text-[#1B4332] hover:underline text-xs font-medium"
                      >
                        Enter Scores →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STANDINGS TAB */}
      {tab === 'standings' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Rank', 'Player', 'Hdcp', 'Rounds', 'Avg Net', 'Best Net', 'Total Gross'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-[#6B7770] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ranked.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-[#6B7770]">No scores yet. Add sessions and enter scores to see standings.</td></tr>
              ) : ranked.map(r => (
                <tr key={r.league_member_id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-bold text-[#1A1A1A]">{r.rank}</td>
                  <td className="px-4 py-2.5 font-medium text-[#1A1A1A]">{r.full_name}</td>
                  <td className="px-4 py-2.5 text-[#6B7770]">{r.handicap}</td>
                  <td className="px-4 py-2.5 text-[#6B7770]">{r.rounds_played}</td>
                  <td className="px-4 py-2.5 font-semibold text-[#1A1A1A]">{r.avg_net_score ?? '—'}</td>
                  <td className="px-4 py-2.5 text-[#6B7770]">{r.best_net ?? '—'}</td>
                  <td className="px-4 py-2.5 text-[#6B7770]">{r.total_gross ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
