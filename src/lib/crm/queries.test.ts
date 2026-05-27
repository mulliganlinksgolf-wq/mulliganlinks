// src/lib/crm/queries.test.ts
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

import { getCrmDashboardStats, getRecentActivity, getStaleLeads } from './queries'

describe('getCrmDashboardStats', () => {
  it('counts pipeline courses excluding partner and churned', async () => {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'crm_courses') {
          return { select: vi.fn().mockResolvedValue({ data: [{ stage: 'lead', estimated_value: 500 }, { stage: 'partner', estimated_value: 1000 }, { stage: 'churned', estimated_value: null }], error: null }) }
        }
        if (table === 'crm_outings') {
          return { select: vi.fn().mockResolvedValue({ data: [{ status: 'lead' }, { status: 'completed' }], error: null }) }
        }
        if (table === 'crm_members') {
          return { select: vi.fn().mockResolvedValue({ data: [{ status: 'active', membership_tier: 'eagle' }], error: null }) }
        }
        return { select: vi.fn().mockResolvedValue({ data: [], error: null }) }
      }),
    } as unknown as ReturnType<typeof createAdminClient>)

    const stats = await getCrmDashboardStats()
    expect(stats.pipelineCourses).toBe(1)
    expect(stats.pipelineValue).toBe(500)
    expect(stats.activeOutings).toBe(1)
    expect(stats.payingMembers).toBe(1)
  })
})

describe('getRecentActivity', () => {
  it('returns recent activity log entries', async () => {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        const chain: Record<string, unknown> = {}
        chain.select = vi.fn().mockReturnValue(chain)
        chain.order = vi.fn().mockReturnValue(chain)
        chain.limit = vi.fn().mockResolvedValue({
          data: table === 'crm_activity_log'
            ? [{ id: '1', record_type: 'course', record_id: 'c1', type: 'call', body: 'talked', created_by: 'neil', created_at: '2026-01-01T00:00:00Z' }]
            : [],
          error: null,
        })
        return chain
      }),
    } as unknown as ReturnType<typeof createAdminClient>)

    const result = await getRecentActivity()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })
})

describe('getStaleLeads', () => {
  it('returns courses and outings with activity older than threshold', async () => {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const staleDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        const chain: Record<string, unknown> = {}
        chain.select = vi.fn().mockReturnValue(chain)
        chain.lt = vi.fn().mockReturnValue(chain)
        chain.not = vi.fn().mockResolvedValue({
          data: table === 'crm_courses'
            ? [{ id: '1', name: 'Oak Hollow', stage: 'lead', last_activity_at: staleDate, assigned_to: 'neil' }]
            : [{ id: '2', contact_name: 'Bob Smith', status: 'lead', last_activity_at: staleDate, assigned_to: 'billy' }],
          error: null,
        })
        return chain
      }),
    } as unknown as ReturnType<typeof createAdminClient>)

    const result = await getStaleLeads(7)
    expect(result.staleCourses).toHaveLength(1)
    expect(result.staleCourses[0].name).toBe('Oak Hollow')
    expect(result.staleOutings).toHaveLength(1)
    expect(result.staleOutings[0].contact_name).toBe('Bob Smith')
  })
})
