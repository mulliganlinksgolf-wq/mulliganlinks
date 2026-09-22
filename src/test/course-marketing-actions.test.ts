// @vitest-environment node
import { beforeEach, describe, it, expect, vi } from 'vitest'
const mocks = vi.hoisted(() => ({
  requireManager: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
  revalidatePath: vi.fn(),
}))
vi.mock('@/lib/courseRole', () => ({ requireManager: mocks.requireManager }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => mocks }))
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock('@/lib/course-marketing/server', () => ({
  marketingEnabled: () => true,
  marketingOrigin: () => 'https://example.com',
}))
vi.mock('@/lib/resend', () => ({ getResend: () => ({}) }))
import {
  queueCampaign,
  cancelCampaign,
} from '@/app/course/[slug]/marketing/actions'
function form() {
  const f = new FormData()
  Object.entries({
    campaignId: '00000000-0000-4000-8000-000000000001',
    subject: 'Hello',
    body: 'A round?',
    audience: 'all',
    reviewed: 'yes',
    courseId: 'attacker-course',
  }).forEach(([k, v]) => f.set(k, v))
  return f
}
beforeEach(() => {
  vi.clearAllMocks()
  mocks.requireManager.mockResolvedValue({
    userId: 'manager',
    courseId: 'authorized-course',
  })
  mocks.rpc.mockResolvedValue({ data: 'id' })
})
describe('course marketing actions', () => {
  it('derives course and actor from verified access, never form fields', async () => {
    expect(await queueCampaign('my-course', {}, form())).toHaveProperty(
      'success',
    )
    expect(mocks.requireManager).toHaveBeenCalledWith('my-course')
    expect(mocks.rpc).toHaveBeenCalledWith(
      'queue_course_email',
      expect.objectContaining({
        p_course: 'authorized-course',
        p_actor: 'manager',
      }),
    )
  })
  it('denies staff/outsiders before reading or mutating campaign data', async () => {
    mocks.requireManager.mockRejectedValue(new Error('Not authorized'))
    await expect(queueCampaign('other-course', {}, form())).rejects.toThrow(
      'Not authorized',
    )
    await expect(cancelCampaign('other-course', form())).rejects.toThrow(
      'Not authorized',
    )
    expect(mocks.rpc).not.toHaveBeenCalled()
    expect(mocks.from).not.toHaveBeenCalled()
  })
  it('requires review and rejects unrecognized audiences', async () => {
    const f = form()
    f.delete('reviewed')
    expect(await queueCampaign('my-course', {}, f)).toHaveProperty('error')
    f.set('reviewed', 'yes')
    f.set('audience', 'everyone-on-platform')
    expect(await queueCampaign('my-course', {}, f)).toHaveProperty('error')
    expect(mocks.rpc).not.toHaveBeenCalled()
  })
})
