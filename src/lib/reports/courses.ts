import { createAdminClient } from '@/lib/supabase/admin'

export type HealthLabel = 'healthy' | 'at_risk' | 'critical'

export function healthLabel(score: number): HealthLabel {
  if (score >= 70) return 'healthy'
  if (score >= 40) return 'at_risk'
  return 'critical'
}

export function calcHealthScore(opts: {
  roundsScore: number
  membersScore: number
  revenueScore: number
  waitlistFillRate: number
  daysSinceActivity: number
}): number {
  const activityScore = Math.max(0, 100 - opts.daysSinceActivity * 10)
  const raw =
    opts.roundsScore * 0.30 +
    opts.membersScore * 0.25 +
    opts.revenueScore * 0.25 +
    Math.min(100, opts.waitlistFillRate) * 0.10 +
    Math.min(100, activityScore) * 0.10
  return Math.min(100, Math.max(0, Math.round(raw)))
}

export interface CourseNetworkKpis {
  totalActive: number
  totalRoundsMtd: number
  totalRevenueMtd: number
  avgHealthScore: number
  criticalOrAtRiskCount: number
}

export interface CourseSummaryRow {
  id: string
  name: string
  slug: string
  roundsMtd: number
  revenueMtd: number
  membersAttributed: number
  pointsEarned: number
  pointsRedeemed: number
  waitlistFills: number
  healthScore: number
  healthLabel: HealthLabel
}

export async function getCourseNetworkData(month: string): Promise<{
  kpis: CourseNetworkKpis
  rows: CourseSummaryRow[]
}> {
  const admin = createAdminClient()
  const [
    { data: courses, error: coursesError },
    { data: metrics, error: metricsError },
    { data: auditLog, error: auditError },
  ] = await Promise.all([
    admin.from('courses').select('id, name, slug').eq('status', 'active').order('name'),
    admin.from('crm_course_metrics').select('*').eq('month', month),
    admin.from('admin_audit_log')
      .select('target_id, created_at')
      .eq('target_type', 'course')
      .order('created_at', { ascending: false }),
  ])
  if (coursesError) throw new Error(`[getCourseNetworkData] courses query failed: ${coursesError.message}`)
  if (metricsError) throw new Error(`[getCourseNetworkData] metrics query failed: ${metricsError.message}`)
  // audit log is best-effort — don't throw, just use empty fallback
  if (auditError) console.error('[getCourseNetworkData] audit log query failed (non-fatal):', auditError.message)
  const auditRows = auditError ? [] : (auditLog ?? [])

  const metricsMap = Object.fromEntries((metrics ?? []).map(m => [m.course_id, m]))
  const lastActivityMap: Record<string, number> = {}
  for (const log of auditRows) {
    if (log.target_id && !lastActivityMap[log.target_id]) {
      lastActivityMap[log.target_id] = Math.floor(
        (Date.now() - new Date(log.created_at).getTime()) / (1000 * 60 * 60 * 24)
      )
    }
  }

  const networkRounds = (metrics ?? []).map(m => m.rounds_booked)
  const maxRounds = Math.max(...networkRounds, 1)
  const networkRevenue = (metrics ?? []).map(m => Number(m.green_fee_revenue))
  const maxRevenue = Math.max(...networkRevenue, 1)
  const networkMembers = (metrics ?? []).map(m => m.members_attributed)
  const maxMembers = Math.max(...networkMembers, 1)

  const rows: CourseSummaryRow[] = (courses ?? []).map(c => {
    const m = metricsMap[c.id]
    const rounds = m?.rounds_booked ?? 0
    const revenue = Number(m?.green_fee_revenue ?? 0)
    const members = m?.members_attributed ?? 0
    const waitlistFills = m?.waitlist_fills ?? 0
    const totalCancellations = m?.total_cancellations ?? 0
    const fillRate = totalCancellations > 0 ? (waitlistFills / totalCancellations) * 100 : 0
    const daysSince = lastActivityMap[c.id] ?? 30

    const score = calcHealthScore({
      roundsScore: (rounds / maxRounds) * 100,
      membersScore: (members / maxMembers) * 100,
      revenueScore: (revenue / maxRevenue) * 100,
      waitlistFillRate: fillRate,
      daysSinceActivity: daysSince,
    })

    return {
      id: c.id,
      name: c.name,
      slug: c.slug ?? c.id,
      roundsMtd: rounds,
      revenueMtd: revenue,
      membersAttributed: members,
      pointsEarned: m?.points_earned ?? 0,
      pointsRedeemed: m?.points_redeemed ?? 0,
      waitlistFills,
      healthScore: score,
      healthLabel: healthLabel(score),
    }
  })

  const totalRoundsMtd = rows.reduce((s, r) => s + r.roundsMtd, 0)
  const totalRevenueMtd = rows.reduce((s, r) => s + r.revenueMtd, 0)
  const avgHealthScore = rows.length > 0
    ? Math.round(rows.reduce((s, r) => s + r.healthScore, 0) / rows.length)
    : 0
  const criticalOrAtRiskCount = rows.filter(r => r.healthLabel !== 'healthy').length

  return {
    kpis: { totalActive: rows.length, totalRoundsMtd, totalRevenueMtd, avgHealthScore, criticalOrAtRiskCount },
    rows,
  }
}
