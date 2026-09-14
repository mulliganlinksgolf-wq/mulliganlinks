import { beforeEach, expect, it, vi } from 'vitest'
import { mockDatabase } from './helpers/database'
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/stripe', () => ({ stripe: {
  paymentIntents: { retrieve: vi.fn(), cancel: vi.fn() }, charges: { retrieve: vi.fn() }, refunds: { create: vi.fn(), retrieve: vi.fn() },
} }))
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'
import { cancelReservation } from '@/lib/booking-lifecycle'
let db: ReturnType<typeof mockDatabase>
let booking: Record<string, unknown>
const paidIntent = { id: 'pi-1', status: 'succeeded', metadata: { booking_id: 'booking-1' }, amount: 9500, amount_received: 9500, latest_charge: 'ch-1', transfer_data: { destination: 'acct-1' }, application_fee_amount: 100 }
beforeEach(() => {
  vi.resetAllMocks()
  booking = { id: 'booking-1', status: 'confirmed', cancellation_reason: 'member', stripe_payment_intent_id: 'pi-1', total_charged_cents: 9500 }
  db = mockDatabase()
  db.client.rpc.mockImplementation(async name => ({ data: name === 'request_booking_cancellation' ? booking : true, error: null }) as never)
  vi.mocked(createAdminClient).mockReturnValue(db.client as never)
  vi.mocked(stripe.paymentIntents.retrieve).mockResolvedValue(paidIntent as never)
  vi.mocked(stripe.charges.retrieve).mockResolvedValueOnce({ refunded: false, amount_refunded: 0 } as never).mockResolvedValue({ refunded: true, amount_refunded: 9500 } as never)
  vi.mocked(stripe.refunds.create).mockResolvedValue({ id: 're-1' } as never)
  vi.mocked(stripe.refunds.retrieve).mockResolvedValue({ id: 're-1', status: 'succeeded' } as never)
})
it('refunds the destination charge and app fee before restoring inventory', async () => {
  expect(await cancelReservation('booking-1', 'user-1', 'member')).toEqual({ changed: true, refundedCents: 9500 })
  expect(stripe.refunds.create).toHaveBeenCalledWith({ payment_intent: 'pi-1', reason: 'requested_by_customer', reverse_transfer: true, refund_application_fee: true }, { idempotencyKey: 'booking-cancel-refund-booking-1' })
  expect(db.client.rpc).toHaveBeenLastCalledWith('finish_booking_cancellation', { p_booking_id: 'booking-1', p_refunded_cents: 9500 })
})
it('does not restore inventory if Stripe refund fails', async () => {
  vi.mocked(stripe.refunds.create).mockRejectedValue(new Error('Stripe unavailable'))
  await expect(cancelReservation('booking-1','user-1','member')).rejects.toThrow()
  expect(db.client.rpc).toHaveBeenCalledTimes(1)
})
it('retains the cancellation request while a refund is pending', async () => {
  vi.mocked(stripe.refunds.retrieve).mockResolvedValue({ status: 'pending' } as never)
  await expect(cancelReservation('booking-1','user-1','member')).rejects.toThrow('still processing')
  expect(db.client.rpc).toHaveBeenCalledTimes(1)
})
it('cancels an unpaid intent before expiring the hold', async () => {
  booking.cancellation_reason = 'expired'
  vi.mocked(stripe.paymentIntents.retrieve).mockResolvedValue({ ...paidIntent, status: 'requires_payment_method' } as never)
  vi.mocked(stripe.paymentIntents.cancel).mockResolvedValue({ ...paidIntent, status: 'canceled' } as never)
  await cancelReservation('booking-1','user-1','expired')
  expect(stripe.paymentIntents.cancel).toHaveBeenCalledWith('pi-1',{ cancellation_reason: 'abandoned' },{ idempotencyKey: 'booking-cancel-intent-booking-1' })
  expect(stripe.refunds.create).not.toHaveBeenCalled()
  expect(db.client.rpc).toHaveBeenLastCalledWith('finish_booking_cancellation',{ p_booking_id: 'booking-1',p_refunded_cents: 0 })
})
it('keeps a paid booking when expiry races with successful payment', async () => {
  booking.cancellation_reason='expired'
  await cancelReservation('booking-1','user-1','expired')
  expect(db.client.rpc).toHaveBeenLastCalledWith('settle_booking_payment',expect.objectContaining({ p_amount: 9500 }))
  expect(stripe.refunds.create).not.toHaveBeenCalled()
})
it('returns an already-completed cancellation without another financial action', async () => {
  booking.status='canceled'
  expect((await cancelReservation('booking-1','user-1','member')).changed).toBe(false)
  expect(stripe.paymentIntents.retrieve).not.toHaveBeenCalled()
})
it('denies the cancellation before calling Stripe if the ownership check fails', async () => {
  db.client.rpc.mockResolvedValue({ data: null,error: { message: 'Booking not found' } } as never)
  await expect(cancelReservation('booking-1','other-user','member')).rejects.toThrow('Booking not found')
  expect(stripe.paymentIntents.retrieve).not.toHaveBeenCalled()
})
it('does not finalize when an intent remains in processing after a cancellation race', async () => {
  vi.mocked(stripe.paymentIntents.retrieve).mockResolvedValue({ ...paidIntent,status: 'processing' } as never)
  vi.mocked(stripe.paymentIntents.cancel).mockRejectedValue(new Error('not cancelable'))
  await expect(cancelReservation('booking-1','user-1','member')).rejects.toThrow('still processing')
  expect(db.client.rpc).toHaveBeenCalledTimes(1)
})
