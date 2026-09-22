// @vitest-environment node
import { beforeEach, describe, it, expect, vi } from 'vitest'
const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  maybeSingle: vi.fn(),
}))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => mocks }))
import { GET, POST } from '@/app/api/course-marketing/unsubscribe/route'
const url =
  'https://example.com/api/course-marketing/unsubscribe?token=00000000-0000-4000-8000-000000000001'
beforeEach(() => {
  vi.clearAllMocks()
  const chain = {
    update: mocks.update,
    eq: mocks.eq,
    select: () => chain,
    maybeSingle: mocks.maybeSingle,
  }
  mocks.from.mockReturnValue(chain)
  mocks.update.mockReturnValue(chain)
  mocks.eq.mockReturnValue(chain)
  mocks.maybeSingle.mockResolvedValue({ data: { id: 'subscription' } })
})
describe('unsubscribe links', () => {
  it('does not unsubscribe on a scanner GET', async () => {
    const response = await GET(new Request(url))
    expect(response.status).toBe(200)
    expect(mocks.update).not.toHaveBeenCalled()
    expect(response.headers.get('Referrer-Policy')).toBe('no-referrer')
  })
  it('allows one-click POST without a login and only updates the matching token', async () => {
    expect((await POST(new Request(url, { method: 'POST' }))).status).toBe(200)
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ subscribed: false }),
    )
    expect(mocks.eq).toHaveBeenCalledWith(
      'unsubscribe_token',
      '00000000-0000-4000-8000-000000000001',
    )
  })
  it('rejects malformed tokens without database access', async () => {
    expect(
      (
        await POST(
          new Request('https://example.com/?token=bad', { method: 'POST' }),
        )
      ).status,
    ).toBe(400)
    expect(mocks.from).not.toHaveBeenCalled()
  })
  it('reports persistence failure without pretending to unsubscribe', async () => {
    mocks.maybeSingle.mockResolvedValue({ error: { message: 'offline' } })
    expect((await POST(new Request(url, { method: 'POST' }))).status).toBe(503)
  })
})
