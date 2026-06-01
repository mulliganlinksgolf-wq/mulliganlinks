import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockConstructEvent = vi.fn()
const mockSubRetrieve = vi.fn()
vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: { constructEvent: (...a: any[]) => mockConstructEvent(...a) },
    subscriptions: { retrieve: (...a: any[]) => mockSubRetrieve(...a) },
  },
}))

const calls: any[] = []
const mkChain = (table: string) => ({
  upsert: (vals: any, opts: any) => { calls.push({ table, op: 'upsert', vals, opts }); return Promise.resolve({ error: null }) },
  update: (vals: any) => ({ eq: (col: string, val: any) => { calls.push({ table, op: 'update', vals, col, val }); return Promise.resolve({ error: null }) } }),
})
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from: (t: string) => mkChain(t) }) }))

const mockIssueGuestPasses = vi.fn(async (_userId: string, _tier: string) => {})
vi.mock('@/app/actions/guestPasses', () => ({ issueGuestPasses: (userId: any, tier: any) => mockIssueGuestPasses(userId, tier) }))

import { POST } from '@/app/api/membership/webhook/route'

function webhookReq() {
  return new Request('http://x/api/membership/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': 'sig' },
    body: 'rawbody',
  })
}

beforeEach(() => { vi.clearAllMocks(); calls.length = 0; process.env.STRIPE_WEBHOOK_SECRET = 'whsec' })

describe('membership webhook — native subscription events', () => {
  it('activates membership + issues guest passes on mobile customer.subscription.created', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.created',
      data: { object: {
        id: 'sub_1', customer: 'cus_1', status: 'active',
        metadata: { user_id: 'u1', tier: 'eagle', source: 'mobile' },
        items: { data: [{ current_period_end: 1893456000 }] },
      } },
    })
    const res = await POST(webhookReq() as any)
    expect(res.status).toBe(200)
    const upsert = calls.find((c) => c.op === 'upsert' && c.table === 'memberships')
    expect(upsert.vals).toMatchObject({ user_id: 'u1', tier: 'eagle', status: 'active', stripe_subscription_id: 'sub_1', stripe_customer_id: 'cus_1' })
    expect(mockIssueGuestPasses).toHaveBeenCalledWith('u1', 'eagle')
  })

  it('ignores non-mobile customer.subscription.created (web path owns it)', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.created',
      data: { object: {
        id: 'sub_2', customer: 'cus_2', status: 'active',
        metadata: { user_id: 'u2', tier: 'eagle' },
        items: { data: [{ current_period_end: 1893456000 }] },
      } },
    })
    const res = await POST(webhookReq() as any)
    expect(res.status).toBe(200)
    expect(calls.find((c) => c.op === 'upsert')).toBeUndefined()
    expect(mockIssueGuestPasses).not.toHaveBeenCalled()
  })

  it('sets past_due on invoice.payment_failed', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'invoice.payment_failed',
      data: { object: { subscription: 'sub_1' } },
    })
    const res = await POST(webhookReq() as any)
    expect(res.status).toBe(200)
    const upd = calls.find((c) => c.op === 'update' && c.table === 'memberships')
    expect(upd.vals).toEqual({ status: 'past_due' })
    expect(upd.col).toBe('stripe_subscription_id')
    expect(upd.val).toBe('sub_1')
  })

  it('keeps active + bumps period on invoice.paid', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'invoice.paid',
      data: { object: { subscription: 'sub_1' } },
    })
    mockSubRetrieve.mockResolvedValue({ id: 'sub_1', items: { data: [{ current_period_end: 1900000000 }] } })
    const res = await POST(webhookReq() as any)
    expect(res.status).toBe(200)
    const upd = calls.find((c) => c.op === 'update' && c.table === 'memberships')
    expect(upd.vals.status).toBe('active')
    expect(upd.vals.current_period_end).toBe(new Date(1900000000 * 1000).toISOString())
  })
})
