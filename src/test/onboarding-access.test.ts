import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockDatabase } from './helpers/database'
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('next/headers', () => ({ cookies: vi.fn() }))
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { requireOnboardingAccess } from '@/lib/auth/onboarding'
let db: ReturnType<typeof mockDatabase>
beforeEach(() => {
  db = mockDatabase({ courses: { id: 'course-1', invite_token: 'secret-invite', invite_used: false, onboarding_complete: false } }, null)
  vi.mocked(createAdminClient).mockReturnValue(db.client as never)
  vi.mocked(createClient).mockResolvedValue(db.client as never)
  vi.mocked(cookies).mockResolvedValue({ get: () => undefined } as never)
})
describe('onboarding authorization', () => {
  it('rejects a course ID alone', async () => {
    await expect(requireOnboardingAccess('course-1')).rejects.toThrow('invite or manager')
  })
  it('accepts the valid HttpOnly invite cookie', async () => {
    vi.mocked(cookies).mockResolvedValue({ get: () => ({ value: 'secret-invite' }) } as never)
    await expect(requireOnboardingAccess('course-1')).resolves.toBeUndefined()
  })
  it('rejects a cookie issued for a different course', async () => {
    vi.mocked(cookies).mockResolvedValue({ get: () => ({ value: 'another-invite' }) } as never)
    await expect(requireOnboardingAccess('course-1')).rejects.toThrow()
  })
  it('rejects revoked invites even if a cookie remains', async () => {
    vi.mocked(cookies).mockResolvedValue({ get: () => ({ value: 'secret-invite' }) } as never)
    db.rows.courses = { ...(db.rows.courses as object), invite_used: true }
    await expect(requireOnboardingAccess('course-1')).rejects.toThrow()
  })
  it('allows completion reads but prevents further invite-based edits', async () => {
    vi.mocked(cookies).mockResolvedValue({ get: () => ({ value: 'secret-invite' }) } as never)
    db.rows.courses = { ...(db.rows.courses as object), invite_used: true, onboarding_complete: true }
    await expect(requireOnboardingAccess('course-1', true)).resolves.toBeUndefined()
    await expect(requireOnboardingAccess('course-1')).rejects.toThrow()
  })
  it('accepts a manager only after checking course membership', async () => {
    db.client.auth.getUser.mockResolvedValue({ data: { user: { id: 'manager-1' } } })
    db.rows.course_admins = { role: 'manager' }
    await expect(requireOnboardingAccess('course-1')).resolves.toBeUndefined()
    expect(db.filters).toContainEqual({ table: 'course_admins', key: 'course_id', value: 'course-1' })
  })
  it('denies regular staff', async () => {
    db.client.auth.getUser.mockResolvedValue({ data: { user: { id: 'staff-1' } } })
    db.rows.course_admins = { role: 'staff' }
    await expect(requireOnboardingAccess('course-1')).rejects.toThrow('Not authorized')
  })
})
