// src/app/course/[slug]/leagues/create/page.tsx
'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function CreateLeaguePage() {
  const { slug } = useParams() as { slug: string }
  const router = useRouter()
  const supabase = createClient()

  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    name: '',
    format: 'stroke_play',
    season_start: today,
    season_end: today,
    max_players: '20',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: course } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!course) {
      setError('Course not found')
      setLoading(false)
      return
    }

    const { data: league, error: insertError } = await supabase
      .from('leagues')
      .insert({
        course_id: course.id,
        name: form.name.trim(),
        format: form.format,
        season_start: form.season_start,
        season_end: form.season_end,
        max_players: parseInt(form.max_players),
        notes: form.notes.trim() || null,
        status: 'draft',
      })
      .select('id')
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push(`/course/${slug}/leagues/${league.id}`)
  }

  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#1A1A1A]">New League</h1>
        <button onClick={() => router.back()} className="text-sm text-[#6B7770] hover:text-[#1A1A1A]">← Back</button>
      </div>

      <Card className="bg-white border border-gray-200 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">League details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>League name</Label>
              <Input
                value={form.name}
                onChange={e => update('name', e.target.value)}
                placeholder="e.g. Summer Thursday League"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Format</Label>
              <select
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white"
                value={form.format}
                onChange={e => update('format', e.target.value)}
              >
                <option value="stroke_play">Stroke Play</option>
                <option value="stableford">Stableford</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Season start</Label>
                <Input
                  type="date"
                  value={form.season_start}
                  onChange={e => update('season_start', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Season end</Label>
                <Input
                  type="date"
                  value={form.season_end}
                  onChange={e => update('season_end', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Max players</Label>
              <Input
                type="number"
                value={form.max_players}
                onChange={e => update('max_players', e.target.value)}
                min="2"
                max="200"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <textarea
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none h-20"
                value={form.notes}
                onChange={e => update('notes', e.target.value)}
                placeholder="Entry fee, format details, tee time info..."
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button
              type="submit"
              disabled={loading}
              className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-[#FAF7F2] w-full"
            >
              {loading ? 'Creating...' : 'Create League'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
