import { describe, it, expect, vi, beforeEach } from 'vitest'

function makeChain(data: any) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
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
vi.mock('@/lib/resend', () => ({
  sendBroadcast: vi.fn().mockResolvedValue({ sent: 2 }),
}))

import { sendBroadcastEmail } from '@/app/admin/communications/actions'
import { sendBroadcast } from '@/lib/resend'
import { writeAuditLog } from '@/lib/audit'
import { redirect } from 'next/navigation'

describe('sendBroadcastEmail', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sends to filtered members and writes audit log', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return makeChain({ is_admin: false })
      if (table === 'memberships') return makeChain([
        { tier: 'ace', profiles: { email: 'a@a.com', full_name: 'Alice' } },
        { tier: 'eagle', profiles: { email: 'b@b.com', full_name: 'Bob' } },
      ])
      return makeChain(null)
    })
    const formData = new FormData()
    formData.set('subject', 'Hello members')
    formData.set('body', 'Great news!')
    formData.set('filter', 'eagle_ace')
    await sendBroadcastEmail(formData)
    expect(sendBroadcast).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Hello members',
        recipients: expect.arrayContaining([
          expect.objectContaining({ email: 'a@a.com' }),
        ]),
      })
    )
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'email_sent', targetType: 'communication' })
    )
  })

  it('redirects with error when subject is empty', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return makeChain({ is_admin: false })
      return makeChain([])
    })
    const formData = new FormData()
    formData.set('subject', '  ')
    formData.set('body', 'body')
    formData.set('filter', 'all')
    await sendBroadcastEmail(formData)
    expect(redirect).toHaveBeenCalledWith(expect.stringContaining('/admin/communications?error='))
  })
})
