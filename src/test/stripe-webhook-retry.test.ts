import { beforeEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { mockDatabase } from './helpers/database'
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/stripe', () => ({ stripe: { webhooks: { constructEvent: vi.fn() } } }))
vi.mock('@/lib/emails', () => ({ sendBookingConfirmation: vi.fn().mockResolvedValue(undefined), sendCourseBookingAlert: vi.fn().mockResolvedValue(undefined) }))
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'
import { POST } from '@/app/api/webhooks/stripe/route'
let db: ReturnType<typeof mockDatabase>
let duplicate: boolean
const post = () => POST(new NextRequest('http://localhost/api/webhooks/stripe', { method: 'POST', body: '{}', headers: { 'stripe-signature': 'test-signature' } }))
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_test')
  duplicate = false
  db = mockDatabase({ bookings: { id: 'booking-1', user_id: 'user-1', points_awarded: 60 }, stripe_webhook_events: { processed: false } })
  const original = db.client.from.getMockImplementation()!
  db.client.from.mockImplementation(table => {
    const query = original(table)
    if (table === 'stripe_webhook_events') query.insert.mockImplementation(value => {
      db.writes.push({ table, method: 'insert', value })
      return { then: (resolve: (result: unknown) => unknown) => Promise.resolve({ error: duplicate ? { code: '23505' } : null }).then(resolve) } as never
    })
    return query
  })
  vi.mocked(createAdminClient).mockReturnValue(db.client as never)
  vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({ id: 'evt-1', type: 'payment_intent.succeeded', data: { object: { id: 'pi-1', amount_received: 6000, metadata: { booking_id: 'booking-1' } } } } as never)
})
it('retries an event recorded before a processing failure', async () => {
  duplicate = true
  expect((await post()).status).toBe(200)
  expect(db.client.rpc).toHaveBeenCalledWith('settle_booking_payment', expect.objectContaining({ p_booking_id: 'booking-1' }))
  expect(db.writes).toContainEqual(expect.objectContaining({ table: 'stripe_webhook_events', method: 'update', value: expect.objectContaining({ processed: true }) }))
})
it('skips an event only once processing completed', async () => {
  duplicate = true
  db.rows.stripe_webhook_events = { processed: true }
  expect(await (await post()).json()).toEqual({ received: true, duplicate: true })
  expect(db.client.rpc).not.toHaveBeenCalled()
})
it('returns 500 and leaves the event retryable when settlement fails', async () => {
  db.client.rpc.mockResolvedValue({ data: null, error: { message: 'temporary failure' } } as never)
  expect((await post()).status).toBe(500)
  expect(db.writes).not.toContainEqual(expect.objectContaining({ value: expect.objectContaining({ processed: true }) }))
})
it('propagates failed payment-state writes so Stripe retries them', async () => {
  vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({ id: 'evt-2', type: 'payment_intent.payment_failed', data: { object: { id: 'pi-1', metadata: { booking_id: 'booking-1' } } } } as never)
  db.failures.bookings = { message: 'database unavailable' }
  expect((await post()).status).toBe(500)
})
it('does not let a delayed payment failure overwrite a confirmed payment', async () => {
  vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({ id: 'evt-2', type: 'payment_intent.payment_failed', data: { object: { id: 'pi-1', metadata: { booking_id: 'booking-1' } } } } as never)
  expect((await post()).status).toBe(200)
  expect(db.filters).toContainEqual({ table: 'bookings', key: 'status', value: 'pending_payment' })
  expect(db.filters).toContainEqual({ table: 'bookings', key: 'stripe_payment_intent_id', value: 'pi-1' })
})
