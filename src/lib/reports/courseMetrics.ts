import { createAdminClient } from '@/lib/supabase/admin'

export function calcWaitlistFillRate({ fills, totalCancellations }: { fills: number; totalCancellations: number }): number {
  if (totalCancellations === 0) return 0
  return Math.round((fills / totalCancellations) * 100 * 10) / 10
}

export function calcStaffHoursSaved(waitlistFills: number): number {
  return Math.round((waitlistFills * 15) / 60 * 10) / 10
}

export interface CourseReportKpis {
  roundsThisMonth: number
  revenueThisMonth: number
  membersTotal: number
  waitlistFillsThisMonth: number
  avgGreenFee: number
}

export async function getCourseReportKpis(courseId: string): Promise<CourseReportKpis> {
  const admin = createAdminClient()
  const currentMonth = new Date().toISOString().slice(0, 7)

  const { data: metrics, error: metricsError } = await admin
    .from('crm_course_metrics')
    .select('*')
    .eq('course_id', courseId)
    .eq('month', currentMonth)
    .maybeSingle()
  if (metricsError) throw new Error(`[getCourseReportKpis] metrics query failed: ${metricsError.message}`)

  return {
    roundsThisMonth: metrics?.rounds_booked ?? 0,
    revenueThisMonth: Number(metrics?.green_fee_revenue ?? 0),
    membersTotal: metrics?.members_attributed ?? 0,
    waitlistFillsThisMonth: metrics?.waitlist_fills ?? 0,
    avgGreenFee: Number(metrics?.avg_green_fee ?? 0),
  }
}

export interface CourseMetricRow {
  month: string
  rounds_booked: number
  green_fee_revenue: number
  avg_green_fee: number
  members_attributed: number
  points_earned: number
  points_redeemed: number
  waitlist_fills: number
  total_cancellations: number
  cancellations_recovered_revenue: number
}

export async function getCourseMetricHistory(
  courseId: string,
  months = 12,
  from?: string,
  to?: string,
): Promise<CourseMetricRow[]> {
  const admin = createAdminClient()

  if (from && to) {
    const { data, error } = await admin
      .from('crm_course_metrics')
      .select('*')
      .eq('course_id', courseId)
      .gte('month', from.slice(0, 7))
      .lte('month', to.slice(0, 7))
      .order('month', { ascending: true })
    if (error) throw new Error(`[getCourseMetricHistory] query failed: ${error.message}`)
    return (data ?? []) as CourseMetricRow[]
  }

  const { data, error } = await admin
    .from('crm_course_metrics')
    .select('*')
    .eq('course_id', courseId)
    .order('month', { ascending: false })
    .limit(months)
  if (error) throw new Error(`[getCourseMetricHistory] query failed: ${error.message}`)
  return ((data ?? []).reverse() as CourseMetricRow[])
}
