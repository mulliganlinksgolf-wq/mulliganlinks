'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function CreateTeeTimesPage() {
  const { slug } = useParams() as { slug: string }
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    firstTeeTime: '07:00',
    lastTeeTime: '17:00',
    intervalMinutes: '8',
    basePrice: '45.00',
    maxPlayers: '4',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ created: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  function update(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    const { data: course } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!course) { setError('Course not found'); setLoading(false); return }

    const rows = []
    const start = new Date(form.startDate + 'T00:00:00')
    const end = new Date(form.endDate + 'T00:00:00')
    const interval = parseInt(form.intervalMinutes)

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const [startH, startM] = form.firstTeeTime.split(':').map(Number)
      const [endH, endM] = form.lastTeeTime.split(':').map(Number)
      let current = startH * 60 + startM
      const endMinutes = endH * 60 + endM

      while (current <= endMinutes) {
        const h = Math.floor(current / 60).toString().padStart(2, '0')
        const m = (current % 60).toString().padStart(2, '0')
        rows.push({
          course_id: course.id,
          scheduled_at: `${dateStr}T${h}:${m}:00+00:00`,
          max_players: parseInt(form.maxPlayers),
          available_players: parseInt(form.maxPlayers),
          base_price: parseFloat(form.basePrice),
          status: 'open',
        })
        current += interval
      }
    }

    const { error: insertError } = await supabase
      .from('tee_times')
      .upsert(rows, { onConflict: 'course_id,scheduled_at', ignoreDuplicates: true })

    if (insertError) {
      setError(insertError.message)
    } else {
      setResult({ created: rows.length })
    }
    setLoading(false)
  }

  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#1A1A1A]">Create Tee Times</h1>
        <button onClick={() => router.back()} className="text-sm text-[#6B7770] hover:text-[#1A1A1A]">← Back</button>
      </div>

      <Card className="bg-white border border-gray-200 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Bulk schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Start date</Label>
                <Input type="date" value={form.startDate} onChange={e => update('startDate', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>End date</Label>
                <Input type="date" value={form.endDate} onChange={e => update('endDate', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>First tee time</Label>
                <Input type="time" value={form.firstTeeTime} onChange={e => update('firstTeeTime', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Last tee time</Label>
                <Input type="time" value={form.lastTeeTime} onChange={e => update('lastTeeTime', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Interval (minutes)</Label>
                <Input type="number" value={form.intervalMinutes} onChange={e => update('intervalMinutes', e.target.value)} min="5" max="60" required />
              </div>
              <div className="space-y-1.5">
                <Label>Base price ($)</Label>
                <Input type="number" value={form.basePrice} onChange={e => update('basePrice', e.target.value)} min="0" step="0.01" required />
              </div>
              <div className="space-y-1.5">
                <Label>Max players per slot</Label>
                <Input type="number" value={form.maxPlayers} onChange={e => update('maxPlayers', e.target.value)} min="1" max="4" required />
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {result && (
              <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                ✓ Created {result.created} tee time slots.
                <button type="button" onClick={() => router.push(`/course/${slug}`)} className="ml-2 underline">View tee sheet →</button>
              </div>
            )}

            <Button type="submit" disabled={loading} className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-[#FAF7F2]">
              {loading ? 'Creating...' : 'Create tee times'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
