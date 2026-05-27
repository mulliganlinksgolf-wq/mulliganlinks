import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/resend', () => ({
  getResend: vi.fn(),
}))

const ADMIN_EMAILS = ['nbarris11@gmail.com']

describe('sendCrmEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.RESEND_FROM_EMAIL = 'crm@teeahead.com'
  })

  it('sends an email and logs the activity', async () => {
    const { getResend } = await import('@/lib/resend')
    const { createClient } = await import('@/lib/supabase/server')
    const { createAdminClient } = await import('@/lib/supabase/admin')

    vi.mocked(getResend).mockReturnValue({
      emails: { send: vi.fn().mockResolvedValue({ data: { id: 'email-1' }, error: null }) },
    } as never)

    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1', email: ADMIN_EMAILS[0] } } }) },
    } as never)

    const insertMock = vi.fn().mockResolvedValue({ error: null })
    const updateMock = vi.fn().mockReturnThis()
    const eqMock = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null }) }
          return chain
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: eqMock,
          single: vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null }),
          insert: insertMock,
          update: vi.fn().mockReturnValue({ eq: eqMock }),
        }
      }),
    } as never)

    const { sendCrmEmail } = await import('@/app/actions/crm/email')
    const result = await sendCrmEmail({
      recordType: 'course',
      recordId: 'course-1',
      to: 'gm@oakhollow.com',
      subject: 'Welcome to TeeAhead',
      bodyHtml: '<p>Hello!</p>',
      sentBy: 'neil',
    })

    expect(result.error).toBeUndefined()
    expect(result.success).toBe(true)
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      type: 'email',
      record_type: 'course',
      record_id: 'course-1',
    }))
  })

  it('returns error if Resend is not configured', async () => {
    const { getResend } = await import('@/lib/resend')
    vi.mocked(getResend).mockReturnValue(null)
    const { sendCrmEmail } = await import('@/app/actions/crm/email')
    const result = await sendCrmEmail({
      recordType: 'course',
      recordId: 'course-1',
      to: 'gm@oakhollow.com',
      subject: 'Test',
      bodyHtml: '<p>Test</p>',
      sentBy: 'neil',
    })
    expect(result.error).toBeDefined()
  })
})
