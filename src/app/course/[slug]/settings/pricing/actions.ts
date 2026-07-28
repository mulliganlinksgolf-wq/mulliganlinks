// src/app/course/[slug]/settings/pricing/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/permissions'
import { bulkResolveForDay } from '@/lib/pricing/resolver'
import { revalidatePath } from 'next/cache'

export type RuleInput = {
  id?: string
  name: string
  category: 'peak' | 'twilight' | 'off_peak' | 'holiday' | 'weather' | 'occupancy' | 'days_out' | 'custom'
  enabled: boolean
  daysOfWeek: number[] | null
  startTime: string | null
  endTime: string | null
  isHoliday: boolean | null
  minDaysOut: number | null
  maxDaysOut: number | null
  minOccupancyPct: number | null
  maxOccupancyPct: number | null
  actionType: 'percent_adjust' | 'fixed_amount_adjust' | 'fixed_price_override'
  actionValue: number
  priority: number
  displayLabel: string | null
  internalNote: string | null
}

const FORBIDDEN_LABEL_TERMS = ['hot deal', 'flash sale', 'blowout']

function validateLabel(label: string | null): string | null {
  if (!label) return null
  const lower = label.toLowerCase()
  for (const term of FORBIDDEN_LABEL_TERMS) {
    if (lower.includes(term)) {
      return `Display label cannot contain "${term}" — TeeAhead protects course price integrity by design.`
    }
  }
  return null
}

// Resolve the course id from the slug using the admin client (slug → id is a
// system-level lookup, not user-gated). Returns null if the course doesn't exist.
async function resolveCourseId(slug: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('courses')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  return data?.id ?? null
}

async function recomputeNext30Days(courseId: string) {
  const today = new Date()
  for (let i = 0; i < 30; i++) {
    const d = new Date(today)
    d.setUTCDate(d.getUTCDate() + i)
    const dateStr = d.toISOString().slice(0, 10)
    await bulkResolveForDay({ courseId, date: dateStr })
  }
}

export async function createOrUpdateRuleAction(
  slug: string,
  input: RuleInput,
): Promise<{ id?: string; error?: string }> {
  const courseId = await resolveCourseId(slug)
  if (!courseId) return { error: 'Course not found' }
  const { userId } = await requirePermission(slug, courseId, 'manage_course_settings')

  const labelErr = validateLabel(input.displayLabel)
  if (labelErr) return { error: labelErr }

  const supabase = await createClient()
  const row = {
    course_id: courseId,
    name: input.name,
    category: input.category,
    enabled: input.enabled,
    days_of_week: input.daysOfWeek,
    start_time: input.startTime,
    end_time: input.endTime,
    is_holiday: input.isHoliday,
    min_days_out: input.minDaysOut,
    max_days_out: input.maxDaysOut,
    min_occupancy_pct: input.minOccupancyPct,
    max_occupancy_pct: input.maxOccupancyPct,
    action_type: input.actionType,
    action_value: input.actionValue,
    priority: input.priority,
    display_label: input.displayLabel,
    internal_note: input.internalNote,
    created_by: userId,
  }

  let id: string | undefined
  if (input.id) {
    const { data, error } = await supabase
      .from('rate_rules')
      .update(row)
      .eq('id', input.id)
      .eq('course_id', courseId)
      .select('id')
      .single()
    if (error) return { error: error.message }
    id = data?.id
  } else {
    const { data, error } = await supabase
      .from('rate_rules')
      .insert(row)
      .select('id')
      .single()
    if (error) return { error: error.message }
    id = data?.id
  }

  await recomputeNext30Days(courseId)

  revalidatePath(`/course/${slug}/settings/pricing`)
  return { id }
}

export async function deleteRuleAction(
  slug: string,
  ruleId: string,
): Promise<{ error?: string }> {
  const courseId = await resolveCourseId(slug)
  if (!courseId) return { error: 'Course not found' }
  await requirePermission(slug, courseId, 'manage_course_settings')

  const supabase = await createClient()
  const { error } = await supabase
    .from('rate_rules')
    .delete()
    .eq('id', ruleId)
    .eq('course_id', courseId)
  if (error) return { error: error.message }

  await recomputeNext30Days(courseId)
  revalidatePath(`/course/${slug}/settings/pricing`)
  return {}
}

export async function recomputeRatesAction(
  slug: string,
): Promise<{ error?: string }> {
  const courseId = await resolveCourseId(slug)
  if (!courseId) return { error: 'Course not found' }
  await requirePermission(slug, courseId, 'manage_course_settings')
  await recomputeNext30Days(courseId)
  revalidatePath(`/course/${slug}/settings/pricing`)
  return {}
}
