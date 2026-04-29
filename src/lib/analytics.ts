import { createAdminClient } from '@/lib/supabase/admin'

const TIER_PRICE: Record<string, number> = {
  ace: 159,
  eagle: 89,
  fairway: 0,
}

export interface AnalyticsResult {
  mrr: number
  totalMembers: number
  churnRate: number
  avgRevenuePerMember: number
  tierBreakdown: { tier: string; count: number }[]
  bookingCount: number
}

export interface RecentSignup {
  id: string
  full_name: string | null
  email: string
  tier: string
  founding_member: boolean
  created_at: string
}

export async function computeAnalytics(_period: string): Promise<AnalyticsResult> {
  // reserved for future date-range filtering
  const admin = createAdminClient()

  const [membershipsResult, bookingsResult] = await Promise.all([
    admin.from('memberships').select('tier, status, created_at'),
    admin.from('bookings').select('id').neq('status', 'canceled'),
  ])

  const memberships = membershipsResult.data ?? []
  const active = memberships.filter((m: any) => m.status === 'active')
  const canceled = memberships.filter((m: any) => m.status === 'canceled')

  const mrr = active.reduce((sum: number, m: any) => sum + (TIER_PRICE[m.tier] ?? 0), 0)
  const totalMembers = memberships.length
  const churnRate = totalMembers > 0 ? Math.round((canceled.length / totalMembers) * 100) : 0
  const payingMembers = active.filter((m: any) => m.tier !== 'fairway').length
  const avgRevenuePerMember = payingMembers > 0 ? Math.round((mrr / payingMembers) * 100) / 100 : 0

  const tierCounts = ['ace', 'eagle', 'fairway'].map(tier => ({
    tier,
    count: active.filter((m: any) => m.tier === tier).length,
  }))

  return {
    mrr,
    totalMembers,
    churnRate,
    avgRevenuePerMember,
    tierBreakdown: tierCounts,
    bookingCount: (bookingsResult.data ?? []).length,
  }
}

export async function getRecentSignups(limit = 10): Promise<RecentSignup[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('id, full_name, email, founding_member, created_at, memberships(tier)')
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []).map((p: any) => ({
    id: p.id,
    full_name: p.full_name,
    email: p.email ?? '',
    tier: Array.isArray(p.memberships) ? (p.memberships[0]?.tier ?? 'fairway') : (p.memberships?.tier ?? 'fairway'),
    founding_member: p.founding_member,
    created_at: p.created_at,
  }))
}

export function buildMrrHistory(memberships: { tier: string; status: string; created_at: string }[]): { month: string; mrr: number }[] {
  // Note: uses current membership status, not historical — canceled memberships are excluded from all historical months.
  const months: { month: string; mrr: number }[] = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    const activeAtMonth = memberships.filter(m =>
      new Date(m.created_at) <= monthEnd &&
      m.status === 'active'
    )
    const mrr = activeAtMonth.reduce((sum, m) => sum + (TIER_PRICE[m.tier] ?? 0), 0)
    months.push({ month: label, mrr })
  }
  return months
}
