'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireManager } from '@/lib/courseRole'
import { refreshOperatingDays } from '@/lib/operating-days'
import { computeSunTimes } from '@/lib/sun-times'

export type OperationsSettingsInput = {
  latitude: number | null
  longitude: number | null
  timezone: string
  sunriseOffsetMinutes: number
  sunsetOffsetMinutes: number
  sunriseAutomationEnabled: boolean
  allowBackNineBooking: boolean
}

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

export async function updateOperationsSettings(
  slug: string,
  input: OperationsSettingsInput
): Promise<ActionResult> {
  try {
    const ctx = await requireManager(slug)
    const admin = createAdminClient()

    const { error: updErr } = await admin
      .from('courses')
      .update({
        latitude: input.latitude,
        longitude: input.longitude,
        timezone: input.timezone,
        sunrise_offset_minutes: input.sunriseOffsetMinutes,
        sunset_offset_minutes: input.sunsetOffsetMinutes,
        sunrise_automation_enabled: input.sunriseAutomationEnabled,
        allow_back_nine_booking: input.allowBackNineBooking,
      })
      .eq('id', ctx.courseId)

    if (updErr) return { ok: false, error: updErr.message }

    if (
      input.sunriseAutomationEnabled &&
      input.latitude != null &&
      input.longitude != null
    ) {
      await refreshOperatingDays({ courseId: ctx.courseId, daysAhead: 30 })
    }

    revalidatePath(`/course/${slug}/settings/operations`)
    revalidatePath(`/course/${slug}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? (e instanceof Error ? e.message : String(e)) : String(e) }
  }
}

export type PreviewRow = {
  date: string
  firstBookable: string
  lastBookable: string
  sunrise: string
  sunset: string
}

export async function previewSunTimes(input: {
  latitude: number
  longitude: number
  sunriseOffsetMinutes: number
  sunsetOffsetMinutes: number
}): Promise<ActionResult<PreviewRow[]>> {
  try {
    const rows: PreviewRow[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      d.setHours(12, 0, 0, 0)
      const sun = computeSunTimes({
        date: d,
        latitude: input.latitude,
        longitude: input.longitude,
        sunriseOffsetMinutes: input.sunriseOffsetMinutes,
        sunsetOffsetMinutes: input.sunsetOffsetMinutes,
      })
      rows.push({
        date: d.toISOString().slice(0, 10),
        firstBookable: sun.firstBookable.toISOString(),
        lastBookable: sun.lastBookable.toISOString(),
        sunrise: sun.sunrise.toISOString(),
        sunset: sun.sunset.toISOString(),
      })
    }
    return { ok: true, data: rows }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? (e instanceof Error ? e.message : String(e)) : String(e) }
  }
}
