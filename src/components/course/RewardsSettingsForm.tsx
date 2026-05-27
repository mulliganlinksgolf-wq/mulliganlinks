'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface RewardsSettings {
  course_id: string
  points_threshold: number
  max_redemptions_fairway: number
  max_redemptions_eagle: number
  max_redemptions_ace: number
  blackout_dates: string[]
  eligible_slot_start: string | null
  eligible_slot_end: string | null
  monthly_redemption_cap: number | null
  notice_hours: number
}

export function RewardsSettingsForm({
  courseId,
  initial,
}: {
  courseId: string
  initial: RewardsSettings | null
}) {
  const defaults = {
    points_threshold: 5000,
    max_redemptions_fairway: 1,
    max_redemptions_eagle: 2,
    max_redemptions_ace: 3,
    blackout_dates: [] as string[],
    eligible_slot_start: '',
    eligible_slot_end: '',
    monthly_redemption_cap: '',
    notice_hours: 48,
  }

  const [form, setForm] = useState({
    points_threshold: initial?.points_threshold ?? defaults.points_threshold,
    max_redemptions_fairway: initial?.max_redemptions_fairway ?? defaults.max_redemptions_fairway,
    max_redemptions_eagle: initial?.max_redemptions_eagle ?? defaults.max_redemptions_eagle,
    max_redemptions_ace: initial?.max_redemptions_ace ?? defaults.max_redemptions_ace,
    blackout_dates: initial?.blackout_dates ?? defaults.blackout_dates,
    eligible_slot_start: initial?.eligible_slot_start ?? defaults.eligible_slot_start,
    eligible_slot_end: initial?.eligible_slot_end ?? defaults.eligible_slot_end,
    monthly_redemption_cap: initial?.monthly_redemption_cap?.toString() ?? defaults.monthly_redemption_cap,
    notice_hours: initial?.notice_hours ?? defaults.notice_hours,
  })
  const [newBlackout, setNewBlackout] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  function setField<K extends keyof typeof form>(key: K, val: typeof form[K]) {
    setForm(f => ({ ...f, [key]: val }))
    setSaved(false)
  }

  function addBlackout() {
    if (!newBlackout || form.blackout_dates.includes(newBlackout)) return
    setField('blackout_dates', [...form.blackout_dates, newBlackout].sort())
    setNewBlackout('')
  }

  function removeBlackout(date: string) {
    setField('blackout_dates', form.blackout_dates.filter(d => d !== date))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      course_id: courseId,
      points_threshold: form.points_threshold,
      max_redemptions_fairway: form.max_redemptions_fairway,
      max_redemptions_eagle: form.max_redemptions_eagle,
      max_redemptions_ace: form.max_redemptions_ace,
      blackout_dates: form.blackout_dates,
      eligible_slot_start: form.eligible_slot_start || null,
      eligible_slot_end: form.eligible_slot_end || null,
      monthly_redemption_cap: form.monthly_redemption_cap ? parseInt(form.monthly_redemption_cap, 10) : null,
      notice_hours: form.notice_hours,
      updated_at: new Date().toISOString(),
    }

    const { error: err } = await supabase
      .from('course_redemption_settings')
      .upsert(payload, { onConflict: 'course_id' })

    setSaving(false)
    if (err) { setError(err.message); return }
    setSaved(true)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Points & Caps */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader><CardTitle className="text-sm font-semibold text-[#1A1A1A]">Points & Caps</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="pts_threshold" className="text-xs text-[#6B7770]">Points needed for one free round</Label>
            <Input
              id="pts_threshold"
              type="number"
              min={1}
              value={form.points_threshold}
              onChange={e => setField('points_threshold', parseInt(e.target.value, 10) || 5000)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-[#6B7770]">Max point redemptions per season</Label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {(['fairway', 'eagle', 'ace'] as const).map(t => (
                <div key={t}>
                  <Label htmlFor={`max_${t}`} className="text-[10px] text-[#6B7770] capitalize">{t}</Label>
                  <Input
                    id={`max_${t}`}
                    type="number"
                    min={0}
                    value={form[`max_redemptions_${t}`]}
                    onChange={e => setField(`max_redemptions_${t}`, parseInt(e.target.value, 10) || 0)}
                    className="mt-0.5"
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="monthly_cap" className="text-xs text-[#6B7770]">Monthly redemption cap</Label>
            <Input
              id="monthly_cap"
              type="number"
              min={0}
              placeholder="No limit"
              value={form.monthly_redemption_cap}
              onChange={e => setField('monthly_redemption_cap', e.target.value)}
              className="mt-1"
            />
            <p className="text-[10px] text-[#aaa] mt-1">Leave blank for no limit. Suggested: 10% of your average monthly rounds.</p>
          </div>
        </CardContent>
      </Card>

      {/* Booking Rules */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader><CardTitle className="text-sm font-semibold text-[#1A1A1A]">Booking Rules</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-[#6B7770]">Blackout dates</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="date"
                value={newBlackout}
                onChange={e => setNewBlackout(e.target.value)}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={addBlackout} className="shrink-0">Add</Button>
            </div>
            {form.blackout_dates.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.blackout_dates.map(d => (
                  <span
                    key={d}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-sans bg-[#1B4332] text-white"
                  >
                    {d}
                    <button type="button" onClick={() => removeBlackout(d)} className="opacity-60 hover:opacity-100">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div>
            <Label className="text-xs text-[#6B7770]">Eligible tee time window (leave blank for all times)</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div>
                <Label htmlFor="slot_start" className="text-[10px] text-[#6B7770]">From</Label>
                <Input
                  id="slot_start"
                  type="time"
                  value={form.eligible_slot_start ?? ''}
                  onChange={e => setField('eligible_slot_start', e.target.value)}
                  className="mt-0.5"
                />
              </div>
              <div>
                <Label htmlFor="slot_end" className="text-[10px] text-[#6B7770]">To</Label>
                <Input
                  id="slot_end"
                  type="time"
                  value={form.eligible_slot_end ?? ''}
                  onChange={e => setField('eligible_slot_end', e.target.value)}
                  className="mt-0.5"
                />
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="notice_hours" className="text-xs text-[#6B7770]">Advance notice required (hours)</Label>
            <Input
              id="notice_hours"
              type="number"
              min={0}
              value={form.notice_hours}
              onChange={e => setField('notice_hours', parseInt(e.target.value, 10) || 0)}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={saving} className="bg-[#1B4332] text-white hover:bg-[#163d2a]">
        {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save rewards settings'}
      </Button>
    </form>
  )
}
