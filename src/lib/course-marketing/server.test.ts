// @vitest-environment node
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(),
  send: vi.fn(),
}))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => mocks }))
vi.mock('@/lib/resend', () => ({
  getResend: () => ({ emails: { send: mocks.send } }),
}))
import { processCourseMarketing } from './server'

const row = {
  id: 'delivery-1',
  subscription_id: 'sub-1',
  campaign_id: 'campaign-1',
  email: 'golfer@example.com',
  unsubscribe_token: 'token',
  attempts: 0,
  first_attempt_at: null as string | null,
  course_email_campaigns: {
    subject: 'Hello',
    body: 'A round?',
    sender_name: 'Course',
    postal_address: '123 Main',
  },
}
let updates: Array<{ table: string; values: Record<string, unknown> }>,
  subscribed: boolean,
  cancelled: boolean,
  selected: (typeof row)[],
  saveError: boolean
function query(table: string) {
  let values: Record<string, unknown> | undefined,
    head = false
  const result = () => {
    if (values)
      return {
        error:
          saveError && 'status' in values && table === 'course_email_deliveries'
            ? { message: 'DB unavailable' }
            : null,
      }
    if (table === 'course_email_subscriptions')
      return { data: { subscribed, email: row.email } }
    if (table === 'course_email_campaigns')
      return { data: { status: cancelled ? 'cancelled' : 'queued' } }
    return head ? { count: 0 } : { data: selected }
  }
  const chain = {
    select: (_?: string, options?: { head?: boolean }) => {
      head = options?.head ?? false
      return chain
    },
    update: (v: Record<string, unknown>) => {
      values = v
      updates.push({ table, values: v })
      return chain
    },
    eq: () => chain,
    order: () => chain,
    limit: () => chain,
    single: () => chain,
    then: (resolve: (value: unknown) => void) =>
      Promise.resolve(result()).then(resolve),
  }
  return chain
}
beforeEach(() => {
  vi.stubEnv('COURSE_MARKETING_ENABLED', 'true')
  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://www.teeahead.com')
  vi.useFakeTimers()
  updates = []
  subscribed = true
  cancelled = false
  selected = [{ ...row }]
  saveError = false
  mocks.rpc.mockResolvedValue({ data: true })
  mocks.from.mockImplementation(query)
  mocks.send.mockResolvedValue({ data: { id: 'provider-1' }, error: null })
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})
async function run() {
  const result = processCourseMarketing()
  await vi.runAllTimersAsync()
  return result
}
describe('campaign delivery', () => {
  it('does no work when another worker owns the lease', async () => {
    mocks.rpc.mockResolvedValue({ data: false })
    expect(await run()).toEqual({ busy: true })
    expect(mocks.send).not.toHaveBeenCalled()
  })
  it('rechecks consent and skips unsubscribed recipients', async () => {
    subscribed = false
    await run()
    expect(mocks.send).not.toHaveBeenCalled()
    expect(updates).toContainEqual(
      expect.objectContaining({
        values: expect.objectContaining({ status: 'skipped' }),
      }),
    )
  })
  it('stops pending mail after cancellation', async () => {
    cancelled = true
    await run()
    expect(mocks.send).not.toHaveBeenCalled()
  })
  it('uses a stable idempotency key and counts only provider acceptance', async () => {
    expect(await run()).toEqual({ sent: 1 })
    expect(mocks.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: row.email,
        headers: expect.objectContaining({
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        }),
      }),
      { idempotencyKey: 'course-email/delivery-1' },
    )
    expect(updates).toContainEqual(
      expect.objectContaining({
        values: expect.objectContaining({
          status: 'sent',
          provider_id: 'provider-1',
        }),
      }),
    )
  })
  it('keeps failed provider requests pending for bounded retries', async () => {
    mocks.send.mockResolvedValue({
      error: { message: 'Rate limited' },
      data: null,
    })
    expect(await run()).toEqual({ sent: 0 })
    expect(updates).toContainEqual(
      expect.objectContaining({
        values: expect.objectContaining({
          status: 'pending',
          error: 'Rate limited',
        }),
      }),
    )
  })
  it('does not replay uncertain sends outside the idempotency window', async () => {
    selected = [
      {
        ...row,
        first_attempt_at: new Date(Date.now() - 21 * 3600000).toISOString(),
      } as typeof row,
    ]
    await run()
    expect(mocks.send).not.toHaveBeenCalled()
    expect(updates).toContainEqual(
      expect.objectContaining({
        values: expect.objectContaining({ status: 'failed' }),
      }),
    )
  })
  it('surfaces persistence errors after provider acceptance', async () => {
    saveError = true
    const result = processCourseMarketing().catch((error) => error)
    await vi.runAllTimersAsync()
    expect(await result).toBeInstanceOf(Error)
  })
})
