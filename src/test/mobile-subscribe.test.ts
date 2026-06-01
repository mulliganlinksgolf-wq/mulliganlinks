import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUserFromBearer = vi.fn()
vi.mock('@/lib/mobile-auth', () => ({ getUserFromBearer: (...a: any[]) => mockGetUserFromBearer(...a) }))

// Chainable supabase admin mock
const membershipRow = { value: null as any }
const mockMaybeSingle = vi.fn(async () => ({ data: membershipRow.value, error: null }))
const mockInsert = vi.fn(async () => ({ error: null }))
const mockUpdate = vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) }))
const mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }))
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockFrom = vi.fn(() => ({ select: mockSelect, insert: mockInsert, update: mockUpdate }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from: mockFrom }) }))

// Stripe mock (unused in free path, present so import resolves)
vi.mock('@/lib/stripe', () => ({ stripe: {} }))

import { POST } from '@/app/api/mobile/membership/subscribe/route'

function post(body: any, user: any = { id: 'u1', email: 'a@b.com' }) {
  mockGetUserFromBearer.mockResolvedValue(user)
  return POST(new Request('http://x/api/mobile/membership/subscribe', {
    method: 'POST',
    headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as any)
}

beforeEach(() => { vi.clearAllMocks(); membershipRow.value = null })

describe('POST /api/mobile/membership/subscribe — free + guards', () => {
  it('401 when not authenticated', async () => {
    mockGetUserFromBearer.mockResolvedValue(null)
    const res = await POST(new Request('http://x', { method: 'POST', body: '{}' }) as any)
    expect(res.status).toBe(401)
  })

  it('400 on invalid tier', async () => {
    const res = await post({ tier: 'platinum' })
    expect(res.status).toBe(400)
  })

  it('409 when already on an active paid tier', async () => {
    membershipRow.value = { tier: 'eagle', status: 'active', stripe_customer_id: 'cus_1' }
    const res = await post({ tier: 'ace' })
    expect(res.status).toBe(409)
  })

  it('creates a free baseline row and returns active for tier=free', async () => {
    const res = await post({ tier: 'free' })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ status: 'active', tier: 'free' })
    expect(mockInsert).toHaveBeenCalledWith({ user_id: 'u1', tier: 'free', status: 'active' })
  })

  it('does not insert a second row if a membership already exists', async () => {
    membershipRow.value = { tier: 'free', status: 'active', stripe_customer_id: null }
    const res = await post({ tier: 'free' })
    expect(res.status).toBe(200)
    expect(mockInsert).not.toHaveBeenCalled()
  })
})
