import { beforeEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { mockDatabase } from './helpers/database'
vi.mock('@/lib/stripe', () => ({ stripe: { webhooks: { constructEvent: vi.fn() }, subscriptions: { retrieve: vi.fn() } } }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/app/actions/guestPasses', () => ({ issueGuestPasses: vi.fn() }))
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { issueGuestPasses } from '@/app/actions/guestPasses'
import { POST } from '@/app/api/membership/webhook/route'
let db: ReturnType<typeof mockDatabase>
const subscription = { id: 'sub-1', customer: 'cus-1', start_date: 1780272000, status: 'active', metadata: { user_id: 'user-1', tier: 'eagle', source: 'mobile' }, items: { data: [{ current_period_end: 1811808000 }] } }
const post = () => POST(new NextRequest('http://localhost/api/membership/webhook', { method: 'POST', body: '{}', headers: { 'stripe-signature': 'sig' } }))
function event(type: string, object: object) { vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({ id: 'evt-1', type, data: { object } } as never) }
beforeEach(() => {
  vi.resetAllMocks()
  db = mockDatabase()
  vi.mocked(createAdminClient).mockReturnValue(db.client as never)
  vi.mocked(stripe.subscriptions.retrieve).mockResolvedValue(subscription as never)
  vi.mocked(issueGuestPasses).mockResolvedValue(undefined)
  event('customer.subscription.updated', subscription)
})
it('ignores the unpaid subscription.created event', async () => {
  event('customer.subscription.created', { ...subscription, status: 'incomplete' })
  expect((await post()).status).toBe(200)
  expect(db.writes).toHaveLength(0)
  expect(issueGuestPasses).not.toHaveBeenCalled()
})
it('activates a paid native subscription and uses an anniversary grant key', async () => {
  expect((await post()).status).toBe(200)
  expect(db.writes[0].value).toMatchObject({ status: 'active', user_id: 'user-1', stripe_customer_id: 'cus-1' })
  expect(issueGuestPasses).toHaveBeenCalledWith('user-1', 'eagle', 'sub-1', '2027-06-01T00:00:00.000Z')
})
it('web checkout and subscription events use the same grant key', async () => {
  await post()
  event('checkout.session.completed', { mode: 'subscription', subscription: 'sub-1' })
  await post()
  expect(vi.mocked(issueGuestPasses).mock.calls[0]).toEqual(vi.mocked(issueGuestPasses).mock.calls[1])
})
it('returns 500 when benefit issuance fails after the membership write, allowing a retry', async () => {
  vi.mocked(issueGuestPasses).mockRejectedValueOnce(new Error('database unavailable'))
  expect((await post()).status).toBe(500)
  expect((await post()).status).toBe(200)
  expect(issueGuestPasses).toHaveBeenCalledTimes(2)
})
it('uses current Stripe state instead of an out-of-order active event', async () => {
  vi.mocked(stripe.subscriptions.retrieve).mockResolvedValue({ ...subscription, status: 'canceled' } as never)
  expect((await post()).status).toBe(200)
  expect(db.writes[0].value).toMatchObject({ status: 'canceled' })
  expect(issueGuestPasses).not.toHaveBeenCalled()
})
it('reconciles failed invoices with current subscription state', async () => {
  event('invoice.payment_failed', { parent: { subscription_details: { subscription: 'sub-1' } } })
  vi.mocked(stripe.subscriptions.retrieve).mockResolvedValue({ ...subscription, status: 'past_due' } as never)
  expect((await post()).status).toBe(200)
  expect(db.writes[0].value).toMatchObject({ status: 'past_due' })
})
it('fails closed on an invalid signature', async () => {
  vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => { throw new Error('invalid') })
  expect((await post()).status).toBe(400)
  expect(db.writes).toHaveLength(0)
})
