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
const priorRow = { value: null as any }
const mkChain = (table: string) => ({
  upsert: (vals: any, opts: any) => { calls.push({ table, op: 'upsert', vals, opts }); return Promise.resolve({ error: null }) },
  update: (vals: any) => ({ eq: (col: string, val: any) => { calls.push({ table, op: 'update', vals, col, val }); return Promise.resolve({ error: null }) } }),
  select: (_cols?: string) => ({ eq: (_c: string, _v: any) => ({ maybeSingle: async () => ({ data: priorRow.value, error: null }) }) }),
})
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from: (t: string) => mkChain(t) }) }))

const mockIssueGuestPasses = vi.fn(async (..._a: any[]) => {})
vi.mock('@/app/actions/guestPasses', () => ({ issueGuestPasses: (...a: any[]) => mockIssueGuestPasses(...a) }))

import { POST } from '@/app/api/membership/webhook/route'

function webhookReq() {
  return new Request('http://x/api/membership/webhook', { method: 'POST', headers: { 'stripe-signature': 'sig' }, body: 'rawbody' })
}

beforeEach(() => { vi.clearAllMocks(); calls.length = 0; priorRow.value = null; process.env.STRIPE_WEBHOOK_SECRET = 'whsec' })

describe('membership webhook — native subscription events', () => {
  it('does NOT activate or issue passes on customer.subscription.created (incomplete, pre-payment)', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.created',
      data: { object: { id: 'sub_1', customer: 'cus_1', status: 'incomplete', metadata: { user_id: 'u1', tier: 'eagle', source: 'mobile' }, items: { data: [{ current_period_end: 1893456000 }] } } },
    })
    const res = await POST(webhookReq() as any)
    expect(res.status).toBe(200)
    expect(calls.find((c) => c.op === 'upsert')).toBeUndefined()
    expect(mockIssueGuestPasses).not.toHaveBeenCalled()
  })

  it('activates membership + issues guest passes on mobile subscription.updated→active (fresh)', async () => {
    priorRow.value = { stripe_subscription_id: null, status: 'active', tier: 'free' }
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.updated',
      data: { object: { id: 'sub_1', customer: 'cus_1', status: 'active', metadata: { user_id: 'u1', tier: 'eagle', source: 'mobile' }, items: { data: [{ current_period_end: 1893456000 }] } } },
    })
    const res = await POST(webhookReq() as any)
    expect(res.status).toBe(200)
    const upsert = calls.find((c) => c.op === 'upsert' && c.table === 'memberships')
    expect(upsert.vals).toMatchObject({ user_id: 'u1', tier: 'eagle', status: 'active', stripe_subscription_id: 'sub_1', stripe_customer_id: 'cus_1' })
    expect(mockIssueGuestPasses).toHaveBeenCalledWith('u1', 'eagle')
  })

  it('does NOT issue guest passes for web subscription.updated→active (source not mobile)', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.updated',
      data: { object: { id: 'sub_2', customer: 'cus_2', status: 'active', metadata: { user_id: 'u2', tier: 'eagle' }, items: { data: [{ current_period_end: 1893456000 }] } } },
    })
    const res = await POST(webhookReq() as any)
    expect(res.status).toBe(200)
    expect(calls.find((c) => c.op === 'upsert')).toBeTruthy()
    expect(mockIssueGuestPasses).not.toHaveBeenCalled()
  })

  it('does NOT re-issue guest passes when already activated (not fresh)', async () => {
    priorRow.value = { stripe_subscription_id: 'sub_1', status: 'active', tier: 'eagle' }
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.updated',
      data: { object: { id: 'sub_1', customer: 'cus_1', status: 'active', metadata: { user_id: 'u1', tier: 'eagle', source: 'mobile' }, items: { data: [{ current_period_end: 1893456000 }] } } },
    })
    const res = await POST(webhookReq() as any)
    expect(res.status).toBe(200)
    expect(mockIssueGuestPasses).not.toHaveBeenCalled()
  })

  it('syncs past_due on non-active subscription.updated', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.updated',
      data: { object: { id: 'sub_1', customer: 'cus_1', status: 'past_due', metadata: { user_id: 'u1', tier: 'eagle', source: 'mobile' }, items: { data: [{ current_period_end: 1900000000 }] } } },
    })
    const res = await POST(webhookReq() as any)
    expect(res.status).toBe(200)
    const upd = calls.find((c) => c.op === 'update' && c.table === 'memberships')
    expect(upd.vals.status).toBe('past_due')
    expect(upd.col).toBe('stripe_subscription_id')
    expect(upd.val).toBe('sub_1')
  })

  it('sets past_due on invoice.payment_failed', async () => {
    mockConstructEvent.mockReturnValue({ type: 'invoice.payment_failed', data: { object: { subscription: 'sub_1' } } })
    const res = await POST(webhookReq() as any)
    expect(res.status).toBe(200)
    const upd = calls.find((c) => c.op === 'update' && c.table === 'memberships')
    expect(upd.vals).toEqual({ status: 'past_due' })
    expect(upd.val).toBe('sub_1')
  })

  it('activates on invoice.paid when subscription is active', async () => {
    mockConstructEvent.mockReturnValue({ type: 'invoice.paid', data: { object: { subscription: 'sub_1' } } })
    mockSubRetrieve.mockResolvedValue({ id: 'sub_1', customer: 'cus_1', status: 'active', metadata: { user_id: 'u1', tier: 'eagle', source: 'mobile' }, items: { data: [{ current_period_end: 1900000000 }] } })
    const res = await POST(webhookReq() as any)
    expect(res.status).toBe(200)
    const upsert = calls.find((c) => c.op === 'upsert' && c.table === 'memberships')
    expect(upsert.vals.status).toBe('active')
    expect(upsert.vals.current_period_end).toBe(new Date(1900000000 * 1000).toISOString())
  })
})
