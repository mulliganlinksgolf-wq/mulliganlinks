import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockEq = vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null }) })
const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
const mockFrom = vi.fn(() => ({ update: mockUpdate, select: mockSelect }))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: mockFrom,
  }),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'admin-1', email: 'nbarris11@gmail.com' } } }) },
  }),
}))

vi.mock('@/lib/audit', () => ({ writeAuditLog: vi.fn().mockResolvedValue(undefined) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { markDisputeWon, markDisputeLost, addDisputeNote } from '@/app/admin/disputes/actions'
import { writeAuditLog } from '@/lib/audit'

describe('markDisputeWon', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates status to won and writes audit log', async () => {
    const result = await markDisputeWon('d-1', 'dp_abc')
    expect(result.success).toBe(true)
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'dispute_updated', targetType: 'dispute' })
    )
  })
})

describe('markDisputeLost', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates status to lost and writes audit log', async () => {
    const result = await markDisputeLost('d-1', 'dp_abc')
    expect(result.success).toBe(true)
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'dispute_updated', targetType: 'dispute' })
    )
  })
})

describe('addDisputeNote', () => {
  beforeEach(() => vi.clearAllMocks())

  it('writes note to audit log', async () => {
    const formData = new FormData()
    formData.set('disputeId', 'd-1')
    formData.set('stripeDisputeId', 'dp_abc')
    formData.set('note', 'Called the bank.')
    const result = await addDisputeNote({}, formData)
    expect(result.success).toBe(true)
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'dispute_updated', details: expect.objectContaining({ note: 'Called the bank.' }) })
    )
  })

  it('returns error when note is empty', async () => {
    const formData = new FormData()
    formData.set('disputeId', 'd-1')
    formData.set('stripeDisputeId', 'dp_abc')
    formData.set('note', '  ')
    const result = await addDisputeNote({}, formData)
    expect(result.error).toBeTruthy()
  })
})
