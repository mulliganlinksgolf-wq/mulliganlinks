// src/lib/crm/queries.ts
import { createAdminClient } from '@/lib/supabase/admin'
import type { CrmDashboardStats, StaleLeadSummary } from './types'

export async function getCrmDashboardStats(): Promise<CrmDashboardStats> {
  const supabase = createAdminClient()
  const [courses, outings, members] = await Promise.all([
    supabase.from('crm_courses').select('stage, estimated_value'),
    supabase.from('crm_outings').select('status'),
    supabase.from('crm_members').select('status, membership_tier'),
  ])

  const nonTerminalCourses = (courses.data ?? []).filter(
    (c) => c.stage !== 'partner' && c.stage !== 'churned'
  )
  const activeOutings = (outings.data ?? []).filter(
    (o) => o.status !== 'completed' && o.status !== 'cancelled'
  )
  const payingMembers = (members.data ?? []).filter(
    (m) => m.status === 'active' && m.membership_tier !== 'free'
  )

  return {
    pipelineCourses: nonTerminalCourses.length,
    activeOutings: activeOutings.length,
    payingMembers: payingMembers.length,
    pipelineValue: nonTerminalCourses.reduce(
      (sum, c) => sum + (c.estimated_value ?? 0),
      0
    ),
  }
}

export async function getRecentActivity(limit = 20) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('crm_activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return data ?? []
}

export async function getStaleLeads(days: number): Promise<StaleLeadSummary> {
  const supabase = createAdminClient()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffIso = cutoff.toISOString()

  const [courses, outings] = await Promise.all([
    supabase
      .from('crm_courses')
      .select('id, name, stage, last_activity_at, assigned_to')
      .lt('last_activity_at', cutoffIso)
      .not('stage', 'in', '("partner","churned")'),
    supabase
      .from('crm_outings')
      .select('id, contact_name, status, last_activity_at, assigned_to')
      .lt('last_activity_at', cutoffIso)
      .not('status', 'in', '("completed","cancelled")'),
  ])

  return {
    staleCourses: courses.data ?? [],
    staleOutings: outings.data ?? [],
  }
}
