import { describe, it, expect, vi, beforeEach } from 'vitest'

function makeChain(data: any) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
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

import { saveConfigValue } from '@/app/admin/config/actions'
import { writeAuditLog } from '@/lib/audit'
import { redirect } from 'next/navigation'

describe('saveConfigValue', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates the config value and writes audit log', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'site_config') return makeChain({ value: '1.49' })
      if (table === 'profiles') return makeChain({ is_admin: false })
      return makeChain(null)
    })
    const formData = new FormData()
    formData.set('key', 'fee_fairway_booking')
    formData.set('value', '1.99')
    await saveConfigValue(formData)
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'config_changed',
        details: expect.objectContaining({ old_value: '1.49', new_value: '1.99' }),
      })
    )
  })

  it('redirects to config page on success', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'site_config') return makeChain({ value: 'waitlist' })
      if (table === 'profiles') return makeChain({ is_admin: false })
      return makeChain(null)
    })
    const formData = new FormData()
    formData.set('key', 'launch_mode')
    formData.set('value', 'live')
    await saveConfigValue(formData)
    expect(redirect).toHaveBeenCalledWith('/admin/config?saved=1')
  })
})
