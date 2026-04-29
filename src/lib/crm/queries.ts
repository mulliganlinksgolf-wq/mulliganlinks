// src/lib/crm/queries.ts
import { createAdminClient } from '@/lib/supabase/admin'
import type { CrmActivityLog, CrmDashboardStats, StaleLeadSummary } from './types'

export async function getCrmDashboardStats(): Promise<CrmDashboardStats> {
  const supabase = createAdminClient()
  const [
    { data: coursesData, error: coursesError },
    { data: outingsData, error: outingsError },
    { data: membersData, error: membersError },
  ] = await Promise.all([
    supabase.from('crm_courses').select('stage, estimated_value'),
    supabase.from('crm_outings').select('status'),
    supabase.from('crm_members').select('status, membership_tier'),
  ])

  if (coursesError) throw new Error(coursesError.message)
  if (outingsError) throw new Error(outingsError.message)
  if (membersError) throw new Error(membersError.message)

  const nonTerminalCourses = (coursesData ?? []).filter(
    (c) => c.stage !== 'partner' && c.stage !== 'churned'
  )
  const activeOutings = (outingsData ?? []).filter(
    (o) => o.status !== 'completed' && o.status !== 'cancelled'
  )
  const payingMembers = (membersData ?? []).filter(
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

export async function getRecentActivity(limit = 20): Promise<CrmActivityLog[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('crm_activity_log')
    .select('id, record_type, record_id, type, body, created_by, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getStaleLeads(days: number): Promise<StaleLeadSummary> {
  const supabase = createAdminClient()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffIso = cutoff.toISOString()

  const [
    { data: coursesData, error: coursesError },
    { data: outingsData, error: outingsError },
  ] = await Promise.all([
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

  if (coursesError) throw new Error(coursesError.message)
  if (outingsError) throw new Error(outingsError.message)

  return {
    staleCourses: coursesData ?? [],
    staleOutings: outingsData ?? [],
  }
}
