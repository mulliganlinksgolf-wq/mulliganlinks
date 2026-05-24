// src/lib/pricing/resolver.ts
//
// Uses the ADMIN (service-role) Supabase client so the cache upsert into
// tee_time_computed_rates bypasses RLS. The cache is a system-level write —
// no end-user session is responsible for it. See migration 091's
// `computed_rates_service_role_write` policy.
import { createAdminClient } from '@/lib/supabase/admin'
import {
  resolvePricing,
  type RateRule,
  type PricingContext,
  type PricingResolution,
} from './rules'

type SupabaseRule = {
  id: string
  name: string
  category: RateRule['category']
  enabled: boolean
  days_of_week: number[] | null
  start_time: string | null
  end_time: string | null
  is_holiday: boolean | null
  min_days_out: number | null
  max_days_out: number | null
  min_occupancy_pct: number | null
  max_occupancy_pct: number | null
  action_type: RateRule['actionType']
  action_value: number | string
  priority: number
  display_label: string | null
}

function dbRuleToDomain(r: SupabaseRule): RateRule {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    enabled: r.enabled,
    daysOfWeek: r.days_of_week,
    startTime: r.start_time,
    endTime: r.end_time,
    isHoliday: r.is_holiday,
    minDaysOut: r.min_days_out,
    maxDaysOut: r.max_days_out,
    minOccupancyPct: r.min_occupancy_pct,
    maxOccupancyPct: r.max_occupancy_pct,
    actionType: r.action_type,
    actionValue: Number(r.action_value),
    priority: r.priority,
    displayLabel: r.display_label,
  }
}

export async function resolvePricingForTeeTime(params: {
  teeTimeId: string
}): Promise<PricingResolution | null> {
  const supabase = createAdminClient()

  const { data: teeTime, error: ttErr } = await supabase
    .from('tee_times')
    .select('id, course_id, scheduled_at, base_price, max_players, available_players')
    .eq('id', params.teeTimeId)
    .single()
  if (ttErr || !teeTime) return null

  const { data: rules } = await supabase
    .from('rate_rules')
    .select('*')
    .eq('course_id', teeTime.course_id)
    .eq('enabled', true)

  const slotDate = new Date(teeTime.scheduled_at)
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const daysOut = Math.floor(
    (slotDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  )

  const dateStr = slotDate.toISOString().slice(0, 10)
  const { data: holiday } = await supabase
    .from('us_holidays')
    .select('name')
    .eq('date', dateStr)
    .maybeSingle()

  // Occupancy: sum max/available across the day's slots
  const dayStart = new Date(slotDate); dayStart.setUTCHours(0, 0, 0, 0)
  const dayEnd   = new Date(slotDate); dayEnd.setUTCHours(23, 59, 59, 999)

  const { data: daySlots } = await supabase
    .from('tee_times')
    .select('max_players, available_players')
    .eq('course_id', teeTime.course_id)
    .gte('scheduled_at', dayStart.toISOString())
    .lte('scheduled_at', dayEnd.toISOString())

  const daySlotsArr: any[] = Array.isArray(daySlots) ? daySlots : []
  const totalCap = daySlotsArr.reduce(
    (s: number, r: any) => s + (r.max_players ?? 4),
    0,
  )
  const totalAvail = daySlotsArr.reduce(
    (s: number, r: any) => s + (r.available_players ?? 0),
    0,
  )
  const occupancyPct = totalCap > 0
    ? Math.round(((totalCap - totalAvail) / totalCap) * 100)
    : 0

  const ctx: PricingContext = {
    slotTime: slotDate,
    isHoliday: !!holiday,
    daysOut,
    occupancyPct,
  }

  const domainRules: RateRule[] = ((rules ?? []) as SupabaseRule[]).map(dbRuleToDomain)
  const resolution = resolvePricing(Number(teeTime.base_price), domainRules, ctx)

  await supabase.from('tee_time_computed_rates').upsert({
    tee_time_id: teeTime.id,
    course_id: teeTime.course_id,
    base_rate: resolution.baseRate,
    computed_rate: resolution.finalRate,
    fired_rule_ids: resolution.appliedRules.map(a => a.rule.id),
    fired_rule_labels: resolution.appliedRules.map(a => a.rule.displayLabel ?? a.rule.name),
    computed_at: new Date().toISOString(),
    computed_for_occupancy_pct: occupancyPct,
  })

  return resolution
}

export async function bulkResolveForDay(params: {
  courseId: string
  date: string // YYYY-MM-DD
}): Promise<void> {
  const supabase = createAdminClient()
  const { data: slots } = await supabase
    .from('tee_times')
    .select('id')
    .eq('course_id', params.courseId)
    .gte('scheduled_at', `${params.date}T00:00:00Z`)
    .lt('scheduled_at', `${params.date}T23:59:59Z`)
  if (!slots) return
  for (const s of slots) {
    await resolvePricingForTeeTime({ teeTimeId: s.id })
  }
}
