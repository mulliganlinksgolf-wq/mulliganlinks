import { createAdminClient } from '@/lib/supabase/admin'
import { EAGLE_PRICE, ACE_PRICE } from './financial'

export function calcChurnRate({ churned, total }: { churned: number; total: number }): number {
  if (total === 0) return 0
  return Math.round((churned / total) * 100 * 10) / 10
}

export function calcLtv({ monthlyPrice, avgMonthsRetained }: { monthlyPrice: number; avgMonthsRetained: number }): number {
  return monthlyPrice * avgMonthsRetained
}

export function labelHealthStatus(daysSinceActivity: number): 'healthy' | 'at_risk' | 'lapsed' {
  if (daysSinceActivity >= 60) return 'lapsed'
  if (daysSinceActivity >= 45) return 'at_risk'
  return 'healthy'
}

export interface MemberKpis {
  totalPaying: number
  mrr: number
  churnRatePct: number
  atRiskCount: number
  eagleCount: number
  aceCount: number
  freeCount: number
}

export async function getMemberKpis(): Promise<MemberKpis> {
  const admin = createAdminClient()
  const { data: memberships, error: membershipsError } = await admin
    .from('memberships').select('tier, status, updated_at')
  if (membershipsError) throw new Error(`[getMemberKpis] memberships query failed: ${membershipsError.message}`)

  const active = (memberships ?? []).filter(m => m.status === 'active')
  const eagleCount = active.filter(m => m.tier === 'eagle').length
  const aceCount = active.filter(m => m.tier === 'ace').length
  const freeCount = active.filter(m => m.tier === 'fairway' || m.tier === 'free').length
  const totalPaying = eagleCount + aceCount
  const mrr = eagleCount * EAGLE_PRICE + aceCount * ACE_PRICE
  const canceled = (memberships ?? []).filter(m => m.status === 'canceled').length
  const churnRatePct = calcChurnRate({ churned: canceled, total: (memberships ?? []).length })

  const cutoff45 = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
  const { count: atRiskCount, error: atRiskError } = await admin
    .from('memberships')
    .select('id', { count: 'exact', head: true })
    .eq('tier', 'eagle')
    .eq('status', 'active')
    .lt('updated_at', cutoff45)
  if (atRiskError) throw new Error(`[getMemberKpis] at-risk count query failed: ${atRiskError.message}`)

  return { totalPaying, mrr, churnRatePct, atRiskCount: atRiskCount ?? 0, eagleCount, aceCount, freeCount }
}

export interface MemberGrowthRow {
  month: string
  totalActive: number
  newFree: number
  newEagle: number
  newAce: number
  churned: number
}

export async function getMemberGrowth(months = 12): Promise<MemberGrowthRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('crm_member_metrics')
    .select('month, total_active, new_members_free, new_members_eagle, new_members_ace, churned_members')
    .order('month', { ascending: false })
    .limit(months)
  if (error) throw new Error(`[getMemberGrowth] query failed: ${error.message}`)
  return (data ?? []).reverse().map(m => ({
    month: m.month,
    totalActive: m.total_active,
    newFree: m.new_members_free,
    newEagle: m.new_members_eagle,
    newAce: m.new_members_ace,
    churned: m.churned_members,
  }))
}

export interface AtRiskMember {
  id: string
  name: string | null
  email: string
  tier: string
  joinedAt: string
  daysSinceActivity: number
}

export async function getAtRiskMembers(): Promise<AtRiskMember[]> {
  const admin = createAdminClient()
  const cutoff = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await admin
    .from('memberships')
    .select('id, tier, created_at, updated_at, profiles(full_name, email)')
    .eq('tier', 'eagle')
    .eq('status', 'active')
    .lt('updated_at', cutoff)
    .limit(100)
  if (error) throw new Error(`[getAtRiskMembers] query failed: ${error.message}`)

  return (data ?? []).map((m: any) => ({
    id: m.id,
    name: m.profiles?.full_name ?? null,
    email: m.profiles?.email ?? '',
    tier: m.tier,
    joinedAt: m.created_at,
    daysSinceActivity: Math.floor((Date.now() - new Date(m.updated_at ?? m.created_at).getTime()) / (1000 * 60 * 60 * 24)),
  }))
}
