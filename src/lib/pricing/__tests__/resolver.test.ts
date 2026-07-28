import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the admin client module to control DB responses.
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

import { createAdminClient } from '@/lib/supabase/admin'
import { resolvePricingForTeeTime } from '../resolver'

type MockClient = {
  from: ReturnType<typeof vi.fn>
}

function mockChain(result: unknown) {
  // Builds a tiny chainable matcher; every chainable method returns `this`,
  // and `single` / `maybeSingle` / await yields `{ data, error }`.
  const ops = ['select', 'eq', 'gte', 'lte', 'lt']
  const obj: any = {
    then: (resolve: any) => resolve(result),
  }
  for (const op of ops) obj[op] = vi.fn(() => obj)
  obj.single = vi.fn(() => Promise.resolve(result))
  obj.maybeSingle = vi.fn(() => Promise.resolve(result))
  obj.upsert = vi.fn(() => Promise.resolve({ error: null }))
  return obj
}

describe('resolvePricingForTeeTime', () => {
  let client: MockClient

  beforeEach(() => {
    client = { from: vi.fn() }
    ;(createAdminClient as any).mockReturnValue(client)
  })

  it('returns null when tee time not found', async () => {
    client.from.mockImplementation((table: string) => {
      if (table === 'tee_times') return mockChain({ data: null, error: { message: 'not found' } })
      return mockChain({ data: [], error: null })
    })
    const r = await resolvePricingForTeeTime({ teeTimeId: 'missing' })
    expect(r).toBeNull()
  })

  it('returns base rate when no rules', async () => {
    client.from.mockImplementation((table: string) => {
      if (table === 'tee_times') return mockChain({
        data: {
          id: 't1',
          course_id: 'c1',
          scheduled_at: '2026-07-04T13:00:00Z',
          base_price: 50,
          max_players: 4,
          available_players: 4,
        },
        error: null,
      })
      if (table === 'rate_rules')  return mockChain({ data: [], error: null })
      if (table === 'us_holidays') return mockChain({ data: { name: 'Independence Day' }, error: null })
      return mockChain({ data: [], error: null })
    })
    const r = await resolvePricingForTeeTime({ teeTimeId: 't1' })
    expect(r).not.toBeNull()
    expect(r!.baseRate).toBe(50)
    expect(r!.finalRate).toBe(50)
  })

  it('applies a holiday rule', async () => {
    client.from.mockImplementation((table: string) => {
      if (table === 'tee_times') return mockChain({
        data: {
          id: 't1',
          course_id: 'c1',
          scheduled_at: '2026-07-04T13:00:00Z',
          base_price: 50,
          max_players: 4,
          available_players: 4,
        },
        error: null,
      })
      if (table === 'rate_rules') return mockChain({
        data: [{
          id: 'r1',
          name: 'Holiday',
          category: 'holiday',
          enabled: true,
          days_of_week: null,
          start_time: null,
          end_time: null,
          is_holiday: true,
          min_days_out: null,
          max_days_out: null,
          min_occupancy_pct: null,
          max_occupancy_pct: null,
          action_type: 'percent_adjust',
          action_value: 20,
          priority: 100,
          display_label: 'Holiday',
        }],
        error: null,
      })
      if (table === 'us_holidays') return mockChain({ data: { name: 'Independence Day' }, error: null })
      return mockChain({ data: [], error: null })
    })
    const r = await resolvePricingForTeeTime({ teeTimeId: 't1' })
    expect(r!.finalRate).toBeCloseTo(60)
  })
})
