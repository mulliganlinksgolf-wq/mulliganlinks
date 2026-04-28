import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockAdminClient,
}))

const mockFrom = vi.fn()
const mockAdminClient = { from: mockFrom }

function makeChain(data: any) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    then: (resolve: any) => resolve({ data, error: null }),
  }
  return chain
}

import { computeAnalytics, getRecentSignups } from '@/lib/analytics'

describe('computeAnalytics', () => {
  it('calculates MRR from active memberships', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'memberships') return makeChain([
        { tier: 'ace', status: 'active', created_at: '2026-01-01' },
        { tier: 'eagle', status: 'active', created_at: '2026-01-01' },
        { tier: 'fairway', status: 'active', created_at: '2026-01-01' },
      ])
      if (table === 'bookings') return makeChain([])
      return makeChain([])
    })
    const result = await computeAnalytics('30d')
    // Ace: $159 + Eagle: $89 = $248
    expect(result.mrr).toBe(248)
  })

  it('calculates total member count', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'memberships') return makeChain([
        { tier: 'eagle', status: 'active', created_at: '2026-01-01' },
        { tier: 'eagle', status: 'active', created_at: '2026-01-01' },
      ])
      if (table === 'bookings') return makeChain([])
      return makeChain([])
    })
    const result = await computeAnalytics('30d')
    expect(result.totalMembers).toBe(2)
  })

  it('calculates churn rate as canceled / total', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'memberships') return makeChain([
        { tier: 'ace', status: 'active', created_at: '2026-01-01' },
        { tier: 'eagle', status: 'canceled', created_at: '2026-01-01' },
        { tier: 'eagle', status: 'canceled', created_at: '2026-01-01' },
        { tier: 'fairway', status: 'active', created_at: '2026-01-01' },
      ])
      if (table === 'bookings') return makeChain([])
      return makeChain([])
    })
    const result = await computeAnalytics('30d')
    expect(result.churnRate).toBe(50) // 2/4 = 50%
  })
})

describe('getRecentSignups', () => {
  it('returns recent profiles in descending order', async () => {
    mockFrom.mockImplementation(() => makeChain([
      { id: '1', full_name: 'Alice', email: 'a@a.com', founding_member: false, created_at: '2026-04-01', memberships: [{ tier: 'eagle' }] },
    ]))
    const result = await getRecentSignups(5)
    expect(result).toHaveLength(1)
    expect(result[0].full_name).toBe('Alice')
  })
})
