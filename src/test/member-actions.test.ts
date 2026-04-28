import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'mem-1', tier: 'eagle' }, error: null })
const mockInsert = vi.fn().mockResolvedValue({ error: null })
const mockSelect = vi.fn()
const mockUpdate = vi.fn()
const mockEq = vi.fn()

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

import { saveProfile, addNote, editTier } from '@/app/admin/users/[userId]/actions'
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
})
