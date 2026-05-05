import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Supabase mocks ──────────────────────────────────────────
const { mockAuthGetUser, mockFrom, mockRpc } = vi.hoisted(() => ({
  mockAuthGetUser: vi.fn(),
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockAuthGetUser },
    from: mockFrom,
    rpc: mockRpc,
  }),
}))

vi.mock('@/lib/resend', () => ({
  sendPartnerRequestEmail: vi.fn().mockResolvedValue(undefined),
  sendPartnerRequestAcceptedEmail: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

// ── Helpers ─────────────────────────────────────────────────
function makeChain(overrides: Partial<{
  data: unknown; error: unknown; count: number
}> = {}) {
  const base = { data: overrides.data ?? null, error: overrides.error ?? null, count: overrides.count ?? 0 }
  const chain: Record<string, unknown> = {}
  const methods = ['select','insert','update','upsert','eq','neq','lt','lte','gte','gt',
                   'in','is','not','order','limit','single','maybeSingle','returns','or']
  for (const m of methods) chain[m] = vi.fn().mockReturnThis()
  chain['then'] = (resolve: (v: typeof base) => unknown) => Promise.resolve(resolve(base))
  return chain as any
}

function authenticatedUser(tier: 'fairway' | 'eagle' | 'ace' = 'eagle') {
  mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
  mockFrom.mockImplementation((table: string) => {
    if (table === 'memberships')
      return makeChain({ data: { tier } })
    return makeChain({ data: null })
  })
}

import {
  upsertPartnerPreferences,
  upsertAvailability,
  deleteAvailability,
  sendConnectionRequest,
  respondToRequest,
  withdrawRequest,
  blockMember,
} from '@/app/app/partners/actions'

describe('tier gate', () => {
  it('rejects fairway members from upsertPartnerPreferences', async () => {
    authenticatedUser('fairway')
    const result = await upsertPartnerPreferences({ bio: 'hello' })
    expect(result.error).toMatch(/Upgrade to Eagle or Ace/)
  })

  it('rejects fairway members from upsertAvailability', async () => {
    authenticatedUser('fairway')
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)
    const result = await upsertAvailability({
      available_date: tomorrow,
      time_preference: 'morning',
      holes: 'either',
    })
    expect(result.error).toMatch(/Upgrade to Eagle or Ace/)
  })

  it('allows eagle members through tier gate', async () => {
    authenticatedUser('eagle')
    const result = await upsertPartnerPreferences({ bio: 'hello' })
    expect(result.error).toBeUndefined()
  })
})

describe('bio length validation', () => {
  beforeEach(() => authenticatedUser('eagle'))

  it('rejects bio longer than 280 chars', async () => {
    const result = await upsertPartnerPreferences({ bio: 'x'.repeat(281) })
    expect(result.error).toMatch(/280/)
  })

  it('accepts bio of exactly 280 chars', async () => {
    const result = await upsertPartnerPreferences({ bio: 'x'.repeat(280) })
    expect(result.error).toBeUndefined()
  })
})

describe('availability date validation', () => {
  beforeEach(() => authenticatedUser('eagle'))

  it('rejects past dates', async () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
    const result = await upsertAvailability({
      available_date: yesterday,
      time_preference: 'flexible',
      holes: 'either',
    })
    expect(result.error).toMatch(/past/)
  })

  it('rejects dates more than 60 days out', async () => {
    const wayOut = new Date(Date.now() + 61 * 86_400_000).toISOString().slice(0, 10)
    const result = await upsertAvailability({
      available_date: wayOut,
      time_preference: 'flexible',
      holes: 'either',
    })
    expect(result.error).toMatch(/60 days/)
  })

  it('accepts today', async () => {
    const today = new Date().toISOString().slice(0, 10)
    const result = await upsertAvailability({
      available_date: today,
      time_preference: 'flexible',
      holes: 'either',
    })
    expect(result.error).toBeUndefined()
  })
})

describe('notes length validation', () => {
  beforeEach(() => authenticatedUser('eagle'))

  it('rejects notes longer than 140 chars', async () => {
    const today = new Date().toISOString().slice(0, 10)
    const result = await upsertAvailability({
      available_date: today,
      time_preference: 'flexible',
      holes: 'either',
      notes: 'x'.repeat(141),
    })
    expect(result.error).toMatch(/140/)
  })

  it('accepts notes of exactly 140 chars', async () => {
    const today = new Date().toISOString().slice(0, 10)
    const result = await upsertAvailability({
      available_date: today,
      time_preference: 'flexible',
      holes: 'either',
      notes: 'x'.repeat(140),
    })
    expect(result.error).toBeUndefined()
  })
})

describe('availability cap', () => {
  it('rejects 8th slot when 7 already exist', async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'memberships') return makeChain({ data: { tier: 'eagle' } })
      if (table === 'partner_availability') return makeChain({ count: 7 })
      return makeChain({ data: null })
    })
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)
    const result = await upsertAvailability({
      available_date: tomorrow,
      time_preference: 'flexible',
      holes: 'either',
    })
    expect(result.error).toMatch(/7/)
  })

  it('accepts 7th slot when 6 already exist', async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'memberships') return makeChain({ data: { tier: 'eagle' } })
      if (table === 'partner_availability') return makeChain({ count: 6 })
      return makeChain({ data: null })
    })
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)
    const result = await upsertAvailability({
      available_date: tomorrow,
      time_preference: 'flexible',
      holes: 'either',
    })
    expect(result.error).toBeUndefined()
  })
})
