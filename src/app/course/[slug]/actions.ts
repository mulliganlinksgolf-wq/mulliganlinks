'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireManager } from '@/lib/courseRole'
import { computeSunTimes } from '@/lib/sun-times'

export type ActionResult = { ok: true } | { ok: false; error: string }

async function ensureOperatingDayRow(courseId: string, dateStr: string) {
  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('course_operating_days')
    .select('id, first_bookable_time, last_bookable_time, sunrise_at, sunset_at')
    .eq('course_id', courseId)
    .eq('operating_date', dateStr)
    .maybeSingle()

  if (existing) return existing

  const { data: course } = await admin
    .from('courses')
    .select('latitude, longitude, sunrise_offset_minutes, sunset_offset_minutes')
    .eq('id', courseId)
    .single()

  let firstBookable = '06:00:00'
  let lastBookable = '20:00:00'
  let sunriseAt = `${dateStr}T11:00:00Z`
  let sunsetAt = `${dateStr}T23:00:00Z`

  if (course?.latitude != null && course?.longitude != null) {
    const date = new Date(dateStr + 'T12:00:00Z')
    const sun = computeSunTimes({
      date,
      latitude: Number(course.latitude),
      longitude: Number(course.longitude),
      sunriseOffsetMinutes: course.sunrise_offset_minutes ?? 30,
      sunsetOffsetMinutes: course.sunset_offset_minutes ?? -90,
    })
    firstBookable = sun.firstBookable.toTimeString().slice(0, 8)
    lastBookable = sun.lastBookable.toTimeString().slice(0, 8)
    sunriseAt = sun.sunrise.toISOString()
    sunsetAt = sun.sunset.toISOString()
  }

  return {
    id: null as string | null,
    first_bookable_time: firstBookable,
    last_bookable_time: lastBookable,
    sunrise_at: sunriseAt,
    sunset_at: sunsetAt,
  }
}

async function generateBackNineSlotsForDay(courseId: string, dateStr: string) {
  const admin = createAdminClient()
  const { data: frontSlots } = await admin
    .from('tee_times')
    .select('scheduled_at, max_players, base_price, status, holes')
    .eq('course_id', courseId)
    .eq('tee_start', 'front')
    .gte('scheduled_at', `${dateStr}T00:00:00+00:00`)
    .lte('scheduled_at', `${dateStr}T23:59:59+00:00`)

  if (!frontSlots?.length) return

  const backRows = frontSlots.map(s => ({
    course_id: courseId,
    scheduled_at: s.scheduled_at,
    max_players: s.max_players,
    base_price: s.base_price,
    holes: 9,
    tee_start: 'back' as const,
    status: 'open',
    available_players: s.max_players,
  }))

  await admin
    .from('tee_times')
    .upsert(backRows, {
      onConflict: 'course_id,scheduled_at,tee_start',
      ignoreDuplicates: true,
    })
}

export async function toggleSplitTeeDay(
  slug: string,
  dateStr: string,
  enabled: boolean
): Promise<ActionResult> {
  try {
    const ctx = await requireManager(slug)
    const admin = createAdminClient()
    const base = await ensureOperatingDayRow(ctx.courseId, dateStr)

    const { error } = await admin
      .from('course_operating_days')
      .upsert(
        {
          course_id: ctx.courseId,
          operating_date: dateStr,
          first_bookable_time: base.first_bookable_time,
          last_bookable_time: base.last_bookable_time,
          sunrise_at: base.sunrise_at,
          sunset_at: base.sunset_at,
          is_split_tee_day: enabled,
        },
        { onConflict: 'course_id,operating_date' }
      )

    if (error) return { ok: false, error: error.message }

    if (enabled) {
      await generateBackNineSlotsForDay(ctx.courseId, dateStr)
    }

    revalidatePath(`/course/${slug}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? (e instanceof Error ? e.message : String(e)) : String(e) }
  }
}

export async function manuallyOverrideOperatingDay(
  slug: string,
  dateStr: string,
  params: {
    firstBookableTime: string
    lastBookableTime: string
    isClosed: boolean
    overrideReason?: string
  }
): Promise<ActionResult> {
  try {
    const ctx = await requireManager(slug)
    const admin = createAdminClient()
    const base = await ensureOperatingDayRow(ctx.courseId, dateStr)

    const { error } = await admin
      .from('course_operating_days')
      .upsert(
        {
          course_id: ctx.courseId,
          operating_date: dateStr,
          first_bookable_time: params.firstBookableTime,
          last_bookable_time: params.lastBookableTime,
          sunrise_at: base.sunrise_at,
          sunset_at: base.sunset_at,
          is_closed: params.isClosed,
          manually_overridden: true,
          override_reason: params.overrideReason ?? null,
        },
        { onConflict: 'course_id,operating_date' }
      )

    if (error) return { ok: false, error: error.message }
    revalidatePath(`/course/${slug}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? (e instanceof Error ? e.message : String(e)) : String(e) }
  }
}

export async function clearManualOverride(
  slug: string,
  dateStr: string
): Promise<ActionResult> {
  try {
    const ctx = await requireManager(slug)
    const admin = createAdminClient()
    const { error } = await admin
      .from('course_operating_days')
      .update({ manually_overridden: false })
      .eq('course_id', ctx.courseId)
      .eq('operating_date', dateStr)

    if (error) return { ok: false, error: error.message }
    revalidatePath(`/course/${slug}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? (e instanceof Error ? e.message : String(e)) : String(e) }
  }
}
