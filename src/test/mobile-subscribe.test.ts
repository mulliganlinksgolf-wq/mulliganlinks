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

const mockCustomersCreate = vi.fn()
const mockSubsList = vi.fn()
const mockSubsCreate = vi.fn()
const mockSubsRetrieve = vi.fn()
const mockEphemeralCreate = vi.fn()
vi.mock('@/lib/stripe', () => ({
  stripe: {
    customers: { create: (...a: any[]) => mockCustomersCreate(...a) },
    subscriptions: {
      list: (...a: any[]) => mockSubsList(...a),
      create: (...a: any[]) => mockSubsCreate(...a),
      retrieve: (...a: any[]) => mockSubsRetrieve(...a),
    },
    ephemeralKeys: { create: (...a: any[]) => mockEphemeralCreate(...a) },
  },
}))
vi.mock('@/lib/stripe/version', () => ({ STRIPE_API_VERSION: '2026-04-22.dahlia' }))

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

describe('POST /api/mobile/membership/subscribe — paid', () => {
  beforeEach(() => {
    process.env.STRIPE_PRICE_EAGLE = 'price_eagle'
    process.env.STRIPE_PRICE_ACE = 'price_ace'
    mockSubsList.mockResolvedValue({ data: [] })
    mockCustomersCreate.mockResolvedValue({ id: 'cus_new' })
    mockSubsCreate.mockResolvedValue({
      id: 'sub_1',
      latest_invoice: { payment_intent: { client_secret: 'pi_secret_123' } },
    })
    mockEphemeralCreate.mockResolvedValue({ secret: 'ek_secret_123' })
  })

  it('creates a customer + subscription and returns the client secret + ephemeral key', async () => {
    const res = await post({ tier: 'eagle' })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({
      paymentIntentClientSecret: 'pi_secret_123',
      ephemeralKey: 'ek_secret_123',
      customerId: 'cus_new',
    })
    expect(mockSubsCreate).toHaveBeenCalledWith(expect.objectContaining({
      customer: 'cus_new',
      items: [{ price: 'price_eagle' }],
      payment_behavior: 'default_incomplete',
      metadata: { user_id: 'u1', tier: 'eagle', source: 'mobile' },
    }))
  })

  it('reuses the existing stripe_customer_id when present', async () => {
    membershipRow.value = { tier: 'free', status: 'active', stripe_customer_id: 'cus_existing' }
    const res = await post({ tier: 'ace' })
    expect(res.status).toBe(200)
    expect(mockCustomersCreate).not.toHaveBeenCalled()
    expect(mockSubsCreate).toHaveBeenCalledWith(expect.objectContaining({
      customer: 'cus_existing',
      items: [{ price: 'price_ace' }],
    }))
  })

  it('reuses an incomplete subscription for the same price instead of creating a new one', async () => {
    membershipRow.value = { tier: 'free', status: 'active', stripe_customer_id: 'cus_existing' }
    mockSubsList.mockResolvedValue({ data: [{ id: 'sub_old', items: { data: [{ price: { id: 'price_eagle' } }] } }] })
    mockSubsRetrieve.mockResolvedValue({
      id: 'sub_old',
      latest_invoice: { payment_intent: { client_secret: 'pi_old_secret' } },
    })
    const res = await post({ tier: 'eagle' })
    const json = await res.json()
    expect(json.paymentIntentClientSecret).toBe('pi_old_secret')
    expect(mockSubsCreate).not.toHaveBeenCalled()
    expect(mockSubsRetrieve).toHaveBeenCalledWith('sub_old', { expand: ['latest_invoice.payment_intent'] })
  })
})
