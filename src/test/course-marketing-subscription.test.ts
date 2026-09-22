// @vitest-environment node
import { beforeEach, describe, it, expect, vi } from 'vitest'
const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  upsert: vi.fn(),
  revalidatePath: vi.fn(),
}))
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({ auth: { getUser: mocks.getUser } }),
}))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => mocks }))
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock('@/lib/course-marketing/server', () => ({
  marketingEnabled: () => true,
}))
import { updateSubscription } from '@/app/course-updates/[slug]/actions'
beforeEach(() => {
  vi.clearAllMocks()
  mocks.getUser.mockResolvedValue({
    data: {
      user: {
        id: 'real-user',
        email: 'Golfer@example.com',
        email_confirmed_at: '2026-09-22',
      },
    },
  })
  const chain = {
    select: () => chain,
    eq: () => chain,
    single: () => Promise.resolve({ data: { id: 'real-course' } }),
    upsert: mocks.upsert,
  }
  mocks.from.mockReturnValue(chain)
  mocks.upsert.mockResolvedValue({ error: null })
})
describe('course subscription consent', () => {
  it('only subscribes the verified signed-in email and ignores forged identity fields', async () => {
    const form = new FormData()
    form.set('subscribed', 'yes')
    form.set('user_id', 'someone-else')
    form.set('email', 'victim@example.com')
    expect(await updateSubscription('course', {}, form)).toHaveProperty(
      'message',
    )
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'real-user',
        course_id: 'real-course',
        email: 'golfer@example.com',
        subscribed: true,
        consent_at: expect.any(String),
      }),
      { onConflict: 'course_id,user_id' },
    )
  })
  it('requires explicit selection to opt in', async () => {
    await updateSubscription('course', {}, new FormData())
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ subscribed: false }),
      expect.anything(),
    )
  })
  it('rejects anonymous or unverified users without a write', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } })
    expect(
      await updateSubscription('course', {}, new FormData()),
    ).toHaveProperty('error')
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'user', email: 'user@example.com' } },
    })
    expect(
      await updateSubscription('course', {}, new FormData()),
    ).toHaveProperty('error')
    expect(mocks.upsert).not.toHaveBeenCalled()
  })
})
