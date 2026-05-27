'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calcNetScore } from '@/lib/leagues'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface InitialMember {
  league_member_id: string
  full_name: string
  handicap: number
  gross_score: string
  handicap_strokes: string
}

interface Props {
  slug: string
  leagueId: string
  sessionId: string
  leagueName: string
  sessionNumber: number
  sessionDate: string
  sessionNotes: string | null
  initialMembers: InitialMember[]
}

export default function ScoreEntryClient({
  slug,
  leagueId,
  sessionId,
  leagueName,
  sessionNumber,
  sessionDate,
  sessionNotes,
  initialMembers,
}: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [rows, setRows] = useState<InitialMember[]>(initialMembers)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function updateRow(idx: number, field: 'gross_score' | 'handicap_strokes', val: string) {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)

    const toUpsert = rows
      .filter(r => r.gross_score !== '')
      .map(r => ({
        session_id: sessionId,
        league_member_id: r.league_member_id,
        gross_score: parseInt(r.gross_score),
        handicap_strokes: parseInt(r.handicap_strokes) || 0,
      }))

    if (toUpsert.length === 0) {
      setError('Enter at least one score before saving.')
      setSaving(false)
      return
    }

    const { error: upsertError } = await supabase
      .from('league_scores')
      .upsert(toUpsert, { onConflict: 'session_id,league_member_id' })

    if (upsertError) {
      setError(upsertError.message)
    } else {
      setSaved(true)
    }
    setSaving(false)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href={`/course/${slug}/leagues/${leagueId}`} className="text-sm text-[#6B7770] hover:text-[#1A1A1A]">
          ← {leagueName}
        </Link>
        <h1 className="text-xl font-bold text-[#1A1A1A] mt-1">
          Session {sessionNumber} — Score Entry
        </h1>
        <p className="text-sm text-[#6B7770]">
          {new Date(sessionDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
          {sessionNotes ? ` · ${sessionNotes}` : ''}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[#6B7770] uppercase tracking-wide">Player</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[#6B7770] uppercase tracking-wide">Gross Score</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[#6B7770] uppercase tracking-wide">Handicap Strokes</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[#6B7770] uppercase tracking-wide">Net Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-[#6B7770]">No active members in this league.</td></tr>
            ) : rows.map((row, idx) => {
              const gross = parseInt(row.gross_score)
              const hdcp = parseInt(row.handicap_strokes) || 0
              const net = row.gross_score !== '' && !isNaN(gross) ? calcNetScore(gross, hdcp) : null
              return (
                <tr key={row.league_member_id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-[#1A1A1A]">{row.full_name}</td>
                  <td className="px-4 py-2.5">
                    <Input
                      type="number"
                      min="1"
                      max="200"
                      value={row.gross_score}
                      onChange={e => updateRow(idx, 'gross_score', e.target.value)}
                      placeholder="—"
                      className="w-20 h-8 text-sm"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <Input
                      type="number"
                      min="0"
                      max="54"
                      value={row.handicap_strokes}
                      onChange={e => updateRow(idx, 'handicap_strokes', e.target.value)}
                      className="w-20 h-8 text-sm"
                    />
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-[#1A1A1A]">
                    {net !== null ? net : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && (
        <p className="text-sm text-emerald-600 font-medium">✓ Scores saved. Standings have been updated.</p>
      )}

      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-[#FAF7F2]"
        >
          {saving ? 'Saving...' : 'Save Scores'}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push(`/course/${slug}/leagues/${leagueId}`)}
        >
          Back to League
        </Button>
      </div>
    </div>
  )
}
