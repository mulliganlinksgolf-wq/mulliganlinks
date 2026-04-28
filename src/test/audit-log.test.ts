import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockInsert = vi.fn()
const mockFrom = vi.fn(() => ({ insert: mockInsert }))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: mockGetUser },
  }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: mockFrom }),
}))

import { writeAuditLog } from '@/lib/audit'

const fakeUser = { id: 'admin-uuid', email: 'neil@example.com' }

beforeEach(() => {
  vi.clearAllMocks()
  mockGetUser.mockResolvedValue({ data: { user: fakeUser } })
  mockInsert.mockResolvedValue({ error: null })
})

describe('writeAuditLog', () => {
  it('inserts a row with correct fields', async () => {
    await writeAuditLog({
      eventType: 'tier_changed',
      targetType: 'member',
      targetId: 'member-uuid',
      targetLabel: 'John Doe',
      details: { from: 'eagle', to: 'ace' },
    })

    expect(mockFrom).toHaveBeenCalledWith('admin_audit_log')
    expect(mockInsert).toHaveBeenCalledWith({
      admin_id: 'admin-uuid',
      admin_email: 'neil@example.com',
      event_type: 'tier_changed',
      target_type: 'member',
      target_id: 'member-uuid',
      target_label: 'John Doe',
      details: { from: 'eagle', to: 'ace' },
    })
  })

  it('does not throw when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    await expect(writeAuditLog({ eventType: 'config_changed', targetType: 'config' })).resolves.toBeUndefined()
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('does not throw when the DB insert fails', async () => {
    mockInsert.mockRejectedValue(new Error('DB down'))
    await expect(
      writeAuditLog({ eventType: 'content_edited', targetType: 'content' })
    ).resolves.toBeUndefined()
  })

  it('uses empty object for details when not provided', async () => {
    await writeAuditLog({ eventType: 'member_deleted', targetType: 'member', targetId: 'u-1', targetLabel: 'Jane' })
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ details: {} }))
  })
})
