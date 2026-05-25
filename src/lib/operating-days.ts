import { createAdminClient } from '@/lib/supabase/admin'
import { computeSunTimes } from './sun-times'

export type RefreshResult = {
  updated: number
  skipped: number
}

export async function refreshOperatingDays(input: {
  courseId: string
  daysAhead?: number
}): Promise<RefreshResult> {
  const { courseId, daysAhead = 30 } = input
  const admin = createAdminClient()

  const { data: course, error: courseErr } = await admin
    .from('courses')
    .select(
      'id, latitude, longitude, sunrise_offset_minutes, sunset_offset_minutes, sunrise_automation_enabled'
    )
    .eq('id', courseId)
    .single()

  if (courseErr || !course) throw new Error(`Course not found: ${courseId}`)
  if (!course.sunrise_automation_enabled) return { updated: 0, skipped: daysAhead }
  if (course.latitude == null || course.longitude == null) {
    throw new Error(`Course ${courseId} is missing latitude/longitude`)
  }

  let updated = 0
  let skipped = 0

  for (let i = 0; i < daysAhead; i++) {
    const date = new Date()
    date.setDate(date.getDate() + i)
    date.setHours(12, 0, 0, 0)
    const dateStr = date.toISOString().slice(0, 10)

    const { data: existing } = await admin
      .from('course_operating_days')
      .select('manually_overridden, is_split_tee_day, is_closed')
      .eq('course_id', courseId)
      .eq('operating_date', dateStr)
      .maybeSingle()

    if (existing?.manually_overridden) {
      skipped++
      continue
    }

    const sun = computeSunTimes({
      date,
      latitude: Number(course.latitude),
      longitude: Number(course.longitude),
      sunriseOffsetMinutes: course.sunrise_offset_minutes,
      sunsetOffsetMinutes: course.sunset_offset_minutes,
    })

    const firstTime = sun.firstBookable.toTimeString().slice(0, 8)
    const lastTime = sun.lastBookable.toTimeString().slice(0, 8)

    const row = {
      course_id: courseId,
      operating_date: dateStr,
      first_bookable_time: firstTime,
      last_bookable_time: lastTime,
      sunrise_at: sun.sunrise.toISOString(),
      sunset_at: sun.sunset.toISOString(),
      is_split_tee_day: existing?.is_split_tee_day ?? false,
      is_closed: existing?.is_closed ?? false,
      manually_overridden: false,
    }

    const { error } = await admin
      .from('course_operating_days')
      .upsert(row, { onConflict: 'course_id,operating_date' })

    if (error) throw error
    updated++
  }

  return { updated, skipped }
}
