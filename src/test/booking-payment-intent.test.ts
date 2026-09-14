import { beforeEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { mockDatabase } from './helpers/database'
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/stripe', () => ({ stripe: { paymentIntents: { create: vi.fn(), retrieve: vi.fn() } } }))
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'
import { POST } from '@/app/api/bookings/[bookingId]/payment-intent/route'
let db: ReturnType<typeof mockDatabase>
const post = () => POST(new NextRequest('http://localhost/api/bookings/booking-1/payment-intent', { method: 'POST' }), { params: Promise.resolve({ bookingId: 'booking-1' }) })
beforeEach(() => {
  vi.resetAllMocks()
  db = mockDatabase({ bookings: {
    id: 'booking-1', user_id: 'user-1', status: 'pending_payment', green_fee_cents: 10000,
    platform_fee_cents: 0, discount_cents: 1500, cart_fee_cents: 1000, total_charged_cents: 9500,
    tee_times: { scheduled_at: '2099-06-20T16:00:00Z', courses: { id: 'course-1', name: 'Test Golf', stripe_charges_enabled: true, stripe_account_id: 'acct-1' } },
  } })
  vi.mocked(createClient).mockResolvedValue(db.client as never)
  vi.mocked(createAdminClient).mockReturnValue(db.client as never)
  vi.mocked(stripe.paymentIntents.create).mockResolvedValue({ id: 'pi-1', client_secret: 'secret' } as never)
})
it('charges the persisted discounted total including the cart, with a stable retry key', async () => {
  expect((await post()).status).toBe(200)
  expect(stripe.paymentIntents.create).toHaveBeenCalledWith(expect.objectContaining({ amount: 9500, application_fee_amount: 0 }), { idempotencyKey: 'booking-payment-booking-1' })
})
it('denies access to another golfer’s booking', async () => {
  db.rows.bookings = { ...(db.rows.bookings as object), user_id: 'other-user' }
  expect((await post()).status).toBe(404)
  expect(stripe.paymentIntents.create).not.toHaveBeenCalled()
})
it('reuses a payment waiting for authentication rather than creating another', async () => {
  db.rows.bookings = { ...(db.rows.bookings as object), stripe_payment_intent_id: 'pi-1' }
  vi.mocked(stripe.paymentIntents.retrieve).mockResolvedValue({ status: 'requires_action', amount: 9500, metadata: { booking_id: 'booking-1' }, client_secret: 'same-secret' } as never)
  expect(await (await post()).json()).toEqual({ client_secret: 'same-secret' })
  expect(stripe.paymentIntents.create).not.toHaveBeenCalled()
})
it('does not reuse a payment with a mismatched amount', async () => {
  db.rows.bookings = { ...(db.rows.bookings as object), stripe_payment_intent_id: 'pi-1' }
  vi.mocked(stripe.paymentIntents.retrieve).mockResolvedValue({ status: 'requires_payment_method', amount: 10000, metadata: { booking_id: 'booking-1' } } as never)
  expect((await post()).status).toBe(409)
  expect(stripe.paymentIntents.create).not.toHaveBeenCalled()
})
it('reports a retryable error when Stripe is unavailable', async () => {
  vi.mocked(stripe.paymentIntents.create).mockRejectedValue(new Error('network unavailable'))
  expect((await post()).status).toBe(502)
})
it('does not return a client secret if recording the payment fails', async () => {
  vi.mocked(stripe.paymentIntents.create).mockImplementation(async () => {
    db.failures.bookings = { message: 'database unavailable' }
    return { id: 'pi-1', client_secret: 'secret' } as never
  })
  const response = await post()
  expect(response.status).toBe(500)
  expect(await response.json()).not.toHaveProperty('client_secret')
})
