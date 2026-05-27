'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  updateOperationsSettings,
  previewSunTimes,
  type PreviewRow,
} from '@/app/course/[slug]/settings/operations/actions'

interface Course {
  id: string
  name: string
  slug: string
  latitude: number | null
  longitude: number | null
  timezone: string
  sunrise_offset_minutes: number
  sunset_offset_minutes: number
  sunrise_automation_enabled: boolean
  allow_back_nine_booking: boolean
}

const TIMEZONES = [
  'America/Detroit',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Phoenix',
  'America/Los_Angeles',
]

export function OperationsSettingsForm({
  slug,
  course,
}: {
  slug: string
  course: Course
}) {
  const [form, setForm] = useState({
    latitude: course.latitude?.toString() ?? '',
    longitude: course.longitude?.toString() ?? '',
    timezone: course.timezone,
    sunriseOffset: course.sunrise_offset_minutes.toString(),
    sunsetOffset: course.sunset_offset_minutes.toString(),
    sunriseEnabled: course.sunrise_automation_enabled,
    allowBackNine: course.allow_back_nine_booking,
  })
  const [isSaving, startSaving] = useTransition()
  const [isPreviewing, startPreviewing] = useTransition()
  const [status, setStatus] = useState<
    | { kind: 'idle' }
    | { kind: 'saved' }
    | { kind: 'error'; message: string }
  >({ kind: 'idle' })
  const [preview, setPreview] = useState<PreviewRow[] | null>(null)

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(f => ({ ...f, [key]: value }))
    setStatus({ kind: 'idle' })
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const lat = form.latitude.trim() === '' ? null : Number(form.latitude)
    const lng = form.longitude.trim() === '' ? null : Number(form.longitude)
    if (lat != null && (Number.isNaN(lat) || lat < -90 || lat > 90)) {
      setStatus({ kind: 'error', message: 'Latitude must be between -90 and 90.' })
      return
    }
    if (lng != null && (Number.isNaN(lng) || lng < -180 || lng > 180)) {
      setStatus({ kind: 'error', message: 'Longitude must be between -180 and 180.' })
      return
    }

    startSaving(async () => {
      const result = await updateOperationsSettings(slug, {
        latitude: lat,
        longitude: lng,
        timezone: form.timezone,
        sunriseOffsetMinutes: Number(form.sunriseOffset) || 0,
        sunsetOffsetMinutes: Number(form.sunsetOffset) || 0,
        sunriseAutomationEnabled: form.sunriseEnabled,
        allowBackNineBooking: form.allowBackNine,
      })
      if (result.ok) {
        setStatus({ kind: 'saved' })
        setPreview(null)
      } else {
        setStatus({ kind: 'error', message: result.error })
      }
    })
  }

  function handlePreview() {
    const lat = Number(form.latitude)
    const lng = Number(form.longitude)
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setStatus({ kind: 'error', message: 'Enter latitude and longitude first.' })
      return
    }
    startPreviewing(async () => {
      const result = await previewSunTimes({
        latitude: lat,
        longitude: lng,
        sunriseOffsetMinutes: Number(form.sunriseOffset) || 0,
        sunsetOffsetMinutes: Number(form.sunsetOffset) || 0,
      })
      if (result.ok && result.data) {
        setPreview(result.data)
        setStatus({ kind: 'idle' })
      } else if (!result.ok) {
        setStatus({ kind: 'error', message: result.error })
      }
    })
  }

  const mapsHref = form.latitude && form.longitude
    ? `https://www.google.com/maps?q=${form.latitude},${form.longitude}`
    : null

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <section className="bg-white rounded-xl ring-1 ring-black/5 p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-[#1A1A1A]">Location</h2>
          <p className="text-xs text-[#6B7770] mt-0.5">
            Used to compute sunrise/sunset for your tee sheet.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              value={form.latitude}
              onChange={e => update('latitude', e.target.value)}
              placeholder="42.4267"
              inputMode="decimal"
            />
          </div>
          <div>
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              value={form.longitude}
              onChange={e => update('longitude', e.target.value)}
              placeholder="-83.3838"
              inputMode="decimal"
            />
          </div>
        </div>

        {mapsHref && (
          <a
            href={mapsHref}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-xs text-[#1B4332] underline underline-offset-2"
          >
            Verify on Google Maps →
          </a>
        )}

        <div>
          <Label htmlFor="timezone">Timezone</Label>
          <select
            id="timezone"
            value={form.timezone}
            onChange={e => update('timezone', e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {TIMEZONES.map(tz => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="bg-white rounded-xl ring-1 ring-black/5 p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-[#1A1A1A]">Sunrise/sunset automation</h2>
            <p className="text-xs text-[#6B7770] mt-0.5">
              First and last bookable tee times update nightly based on the season.
            </p>
          </div>
          <Switch
            checked={form.sunriseEnabled}
            onCheckedChange={v => update('sunriseEnabled', v)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="sunriseOffset">First tee (minutes after sunrise)</Label>
            <Input
              id="sunriseOffset"
              type="number"
              value={form.sunriseOffset}
              onChange={e => update('sunriseOffset', e.target.value)}
              disabled={!form.sunriseEnabled}
            />
          </div>
          <div>
            <Label htmlFor="sunsetOffset">Last tee (minutes relative to sunset)</Label>
            <Input
              id="sunsetOffset"
              type="number"
              value={form.sunsetOffset}
              onChange={e => update('sunsetOffset', e.target.value)}
              disabled={!form.sunriseEnabled}
            />
            <p className="text-[11px] text-[#6B7770] mt-1">
              Use a negative number (e.g. -90) to set the last tee before sunset.
            </p>
          </div>
        </div>

        <div>
          <Button
            type="button"
            variant="outline"
            onClick={handlePreview}
            disabled={isPreviewing || !form.sunriseEnabled}
          >
            {isPreviewing ? 'Computing…' : 'Preview next 7 days'}
          </Button>
        </div>

        {preview && (
          <div className="border border-[#0F3D2E]/10 rounded-md overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-[#F4F1EA] text-[#6B7770]">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Date</th>
                  <th className="text-left px-3 py-2 font-medium">First tee</th>
                  <th className="text-left px-3 py-2 font-medium">Last tee</th>
                </tr>
              </thead>
              <tbody>
                {preview.map(row => (
                  <tr key={row.date} className="border-t border-[#0F3D2E]/5">
                    <td className="px-3 py-2 text-[#1A1A1A]">{row.date}</td>
                    <td className="px-3 py-2 text-[#1A1A1A]">{formatTime(row.firstBookable, form.timezone)}</td>
                    <td className="px-3 py-2 text-[#1A1A1A]">{formatTime(row.lastBookable, form.timezone)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="bg-white rounded-xl ring-1 ring-black/5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-[#1A1A1A]">Back-nine booking</h2>
            <p className="text-xs text-[#6B7770] mt-0.5">
              Let golfers book holes 10–18 as a 9-hole round.
            </p>
          </div>
          <Switch
            checked={form.allowBackNine}
            onCheckedChange={v => update('allowBackNine', v)}
          />
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save changes'}
        </Button>
        {status.kind === 'saved' && (
          <span className="text-sm text-[#0F3D2E]">Saved.</span>
        )}
        {status.kind === 'error' && (
          <span className="text-sm text-red-600">{status.message}</span>
        )}
      </div>
    </form>
  )
}

function formatTime(iso: string, tz: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
  })
}
