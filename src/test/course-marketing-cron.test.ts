// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
const process = vi.hoisted(() => vi.fn())
vi.mock('@/lib/course-marketing/server', () => ({
  processCourseMarketing: process,
}))
import { GET } from '@/app/api/cron/course-marketing/route'
afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})
describe('campaign worker authorization', () => {
  it('rejects a missing secret, including a literal undefined bearer', async () => {
    vi.stubEnv('CRON_SECRET', '')
    const response = await GET(
      new Request('https://example.com', {
        headers: { authorization: 'Bearer undefined' },
      }),
    )
    expect(response.status).toBe(401)
    expect(process).not.toHaveBeenCalled()
  })
  it('rejects unauthenticated requests', async () => {
    vi.stubEnv('CRON_SECRET', 'test-secret')
    expect((await GET(new Request('https://example.com'))).status).toBe(401)
    expect(process).not.toHaveBeenCalled()
  })
  it('processes a correctly authenticated invocation', async () => {
    vi.stubEnv('CRON_SECRET', 'test-secret')
    process.mockResolvedValue({ sent: 2 })
    const response = await GET(
      new Request('https://example.com', {
        headers: { authorization: 'Bearer test-secret' },
      }),
    )
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ sent: 2 })
  })
})
