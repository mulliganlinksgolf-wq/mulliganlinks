import { describe, it, expect, vi, beforeEach } from 'vitest'

function makeChain(data: any) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error: null }),
    then: (resolve: any) => resolve({ data, error: null }),
  }
  return chain
}

const mockFrom = vi.fn()
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: mockFrom }),
}))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'admin-1', email: 'nbarris11@gmail.com' } } }) },
  }),
}))
vi.mock('@/lib/audit', () => ({ writeAuditLog: vi.fn().mockResolvedValue(undefined) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))

import { saveBlock, addBlock } from '@/app/admin/content/actions'
import { writeAuditLog } from '@/lib/audit'
import { redirect } from 'next/navigation'

describe('saveBlock', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates block value and writes audit log', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return makeChain({ is_admin: false })
      if (table === 'content_blocks') return makeChain({ key: 'home.headline', value: 'Old value' })
      return makeChain(null)
    })
    const formData = new FormData()
    formData.set('key', 'home.headline')
    formData.set('value', 'New value')
    await saveBlock(formData)
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'content_edited',
        targetType: 'content',
        details: expect.objectContaining({ old_value: 'Old value', new_value: 'New value' }),
      })
    )
    expect(redirect).toHaveBeenCalled()
  })
})

describe('addBlock', () => {
  beforeEach(() => vi.clearAllMocks())

  it('inserts a new content block', async () => {
    const insertChain: any = {
      then: (resolve: any) => resolve({ data: null, error: null }),
    }
    const insertFn = vi.fn().mockReturnValue(insertChain)
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return makeChain({ is_admin: false })
      if (table === 'content_blocks') {
        const chain = makeChain(null)
        chain.insert = insertFn
        return chain
      }
      return makeChain(null)
    })
    const formData = new FormData()
    formData.set('key', 'pricing.headline')
    formData.set('value', 'Simple pricing')
    formData.set('type', 'text')
    formData.set('description', 'Pricing page headline')
    await addBlock(formData)
    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'pricing.headline', type: 'text', description: 'Pricing page headline' })
    )
    expect(redirect).toHaveBeenCalled()
  })

  it('returns error for empty key', async () => {
    mockFrom.mockImplementation(() => makeChain({ is_admin: false }))
    const formData = new FormData()
    formData.set('key', '  ')
    formData.set('value', 'value')
    formData.set('type', 'text')
    formData.set('description', '')
    const result = await addBlock(formData)
    expect(result?.error).toBeTruthy()
  })
})
