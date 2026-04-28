import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'mem-1', tier: 'eagle' }, error: null })
const mockInsert = vi.fn().mockResolvedValue({ error: null })
const mockSelect = vi.fn()
const mockUpdate = vi.fn()
const mockEq = vi.fn()

const mockStripeSubscriptionsUpdate = vi.fn().mockResolvedValue({})
const mockStripeSubscriptionsRetrieve = vi.fn().mockResolvedValue({
  latest_invoice: {
    payment_intent: {
      amount_received: 15900,
      latest_charge: 'ch_abc123',
    },
  },
  current_period_start: Math.floor(Date.now() / 1000) - 86400 * 15,
  current_period_end: Math.floor(Date.now() / 1000) + 86400 * 16,
})
const mockStripeSubscriptionsCancel = vi.fn().mockResolvedValue({})
const mockStripeRefundsCreate = vi.fn().mockResolvedValue({})

vi.mock('stripe', () => {
  function StripeMock() {
    return {
      subscriptions: {
        update: mockStripeSubscriptionsUpdate,
        retrieve: mockStripeSubscriptionsRetrieve,
        cancel: mockStripeSubscriptionsCancel,
      },
      refunds: {
        create: mockStripeRefundsCreate,
      },
    }
  }
  return { default: StripeMock }
})

// chainable object — every method returns the chain itself so callers can keep chaining.
// The chain is also thenable so `await chain` resolves to { error: null }.
const mockChain: any = {
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  eq: mockEq,
  single: mockSingle,
  then: (resolve: any) => Promise.resolve({ error: null }).then(resolve),
}

function resetChain() {
  mockSelect.mockReturnValue(mockChain)
  mockUpdate.mockReturnValue(mockChain)
  mockEq.mockReturnValue(mockChain)
  mockSingle.mockResolvedValue({ data: { id: 'mem-1', tier: 'eagle' }, error: null })
  mockInsert.mockResolvedValue({ error: null })
}

const mockAdminFrom = vi.fn(() => mockChain)

const mockAdminClient = {
  from: mockAdminFrom,
  auth: { admin: { updateUserById: vi.fn().mockResolvedValue({ error: null }) } },
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockAdminClient,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: 'admin-1', email: 'nbarris11@gmail.com' } } }),
    },
  }),
}))

vi.mock('@/lib/audit', () => ({
  writeAuditLog: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { saveProfile, addNote, editTier, cancelMembership } from '@/app/admin/users/[userId]/actions'
import { writeAuditLog } from '@/lib/audit'

describe('saveProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetChain()
    mockAdminClient.auth.admin.updateUserById.mockResolvedValue({ error: null })
  })

  it('updates profile fields and writes audit log', async () => {
    const formData = new FormData()
    formData.set('userId', 'user-1')
    formData.set('full_name', 'Jane Doe')
    formData.set('phone', '555-1234')
    formData.set('home_course_id', '')
    formData.set('founding_member', 'false')
    formData.set('is_admin', 'false')
    formData.set('email', 'jane@example.com')

    const result = await saveProfile({}, formData)
    expect(result.success).toBe(true)
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'profile_updated', targetType: 'member' })
    )
  })

  it('returns error when full_name is empty', async () => {
    const formData = new FormData()
    formData.set('userId', 'user-1')
    formData.set('full_name', '  ')
    formData.set('phone', '')
    formData.set('home_course_id', '')
    formData.set('founding_member', 'false')
    formData.set('is_admin', 'false')
    formData.set('email', '')

    const result = await saveProfile({}, formData)
    expect(result.error).toBeTruthy()
  })
})

describe('addNote', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetChain()
  })

  it('inserts note and writes audit log', async () => {
    const formData = new FormData()
    formData.set('userId', 'user-1')
    formData.set('body', 'Test note body')

    const result = await addNote({}, formData)
    expect(result.success).toBe(true)
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'admin_note_added', targetType: 'member' })
    )
  })

  it('returns error when body is empty', async () => {
    const formData = new FormData()
    formData.set('userId', 'user-1')
    formData.set('body', '  ')

    const result = await addNote({}, formData)
    expect(result.error).toBeTruthy()
  })
})

describe('editTier', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetChain()
  })

  it('updates membership tier and writes audit log', async () => {
    const result = await editTier('user-1', 'ace', 'eagle')
    expect(result.success).toBe(true)
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'tier_changed', targetType: 'member' })
    )
  })

  it('inserts membership when none exists and writes audit log', async () => {
    mockSingle.mockResolvedValue({ data: null, error: null })
    mockInsert.mockResolvedValue({ error: null })

    const result = await editTier('user-2', 'fairway', '')
    expect(result.success).toBe(true)
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'tier_changed', targetType: 'member' })
    )
  })
})

describe('cancelMembership', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Re-establish mock chain after clearAllMocks
    mockAdminFrom.mockReturnValue(mockChain)
    mockAdminClient.auth.admin.updateUserById.mockResolvedValue({ error: null })
    resetChain()
    mockSingle.mockResolvedValue({ data: { stripe_subscription_id: 'sub_abc', stripe_customer_id: 'cus_abc', current_period_end: '2026-05-01', tier: 'eagle' }, error: null })
    mockUpdate.mockReturnValue(mockChain)
    mockEq.mockReturnValue(mockChain)
    mockSelect.mockReturnValue(mockChain)
    mockStripeSubscriptionsUpdate.mockResolvedValue({})
    mockStripeSubscriptionsCancel.mockResolvedValue({})
    mockStripeRefundsCreate.mockResolvedValue({})
  })

  it('period_end: calls Stripe update and sets cancel_at_period_end=true', async () => {
    const result = await cancelMembership('user-1', 'period_end')
    expect(result.success).toBe(true)
    expect(mockStripeSubscriptionsUpdate).toHaveBeenCalledWith('sub_abc', { cancel_at_period_end: true })
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'membership_cancelled' })
    )
  })

  it('now: cancels subscription and issues refund', async () => {
    const result = await cancelMembership('user-1', 'now')
    expect(result.success).toBe(true)
    expect(mockStripeSubscriptionsCancel).toHaveBeenCalledWith('sub_abc')
    expect(mockStripeRefundsCreate).toHaveBeenCalled()
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'membership_cancelled' })
    )
  })

  it('returns error when no stripe_subscription_id', async () => {
    mockSingle.mockResolvedValue({ data: { stripe_subscription_id: null, tier: 'eagle' }, error: null })
    const result = await cancelMembership('user-1', 'now')
    expect(result.error).toBeTruthy()
  })
})
