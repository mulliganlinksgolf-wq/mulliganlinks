vi.mock('@/lib/booking-lifecycle', () => ({ reconcileReservations: vi.fn().mockResolvedValue({}), cancelReservation: vi.fn() }))
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockDatabase } from './helpers/database'
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
import { createAdminClient } from '@/lib/supabase/admin'
import { getBookingQuote } from '@/lib/booking-quote'
let db: ReturnType<typeof mockDatabase>
beforeEach(() => {
  db = mockDatabase({
    tee_times: { id: 'tt-1', course_id: 'course-1', status: 'open', scheduled_at: '2099-06-20T16:00:00Z', available_players: 4, base_price: 50 },
    courses: { id: 'course-1', stripe_charges_enabled: false },
    memberships: { tier: 'eagle', created_at: '2026-01-01', comp_rounds_remaining: 1 },
    course_tee_sheet_config: { cart_policy: 'optional' }, course_pricing: [{ cart_fee_cents: 1000 }],
    fairway_points: [{ amount: 1000 }], guest_passes: { id: 'pass-1' }, member_credits: [{ amount_cents: 1000 }],
    rain_checks: { amount_cents: 2000 },
  })
  vi.mocked(createAdminClient).mockReturnValue(db.client as never)
})
describe('server-authoritative booking prices', () => {
  it('subtracts the guest pass once and adds the course cart price', async () => {
    const q = await getBookingQuote('user-1', { teeTimeId: 'tt-1', players: 2, guestPassId: 'pass-1', cartSelected: true }, false)
    expect(q.total_charged_cents).toBe(9500)
    expect(q.points_awarded).toBe(142)
  })
  it('uses the same guest discount in online bookings', async () => {
    db.rows.courses = { id: 'course-1', stripe_charges_enabled: true }
    const q = await getBookingQuote('user-1', { teeTimeId: 'tt-1', players: 2, guestPassId: 'pass-1' }, true)
    expect(q.total_charged_cents).toBe(8500)
  })
  it('honors the saved deal price', async () => {
    db.rows.tee_times = { ...(db.rows.tee_times as object), special_price: 40 }
    expect((await getBookingQuote('user-1', { teeTimeId: 'tt-1', players: 2 }, false)).total_charged_cents).toBe(8000)
  })
  it('requires Stripe when the course accepts online payments', async () => {
    db.rows.courses = { id: 'course-1', stripe_charges_enabled: true }
    await expect(getBookingQuote('user-1', { teeTimeId: 'tt-1', players: 2 }, false)).rejects.toThrow('Payment setup changed')
  })
  it.each([0, -1, 1.5, 5, NaN])('rejects invalid player count %s', async players => {
    await expect(getBookingQuote('user-1', { teeTimeId: 'tt-1', players }, false)).rejects.toThrow('players')
    expect(db.client.from).not.toHaveBeenCalled()
  })
  it('rejects expired or already redeemed guest passes', async () => {
    db.rows.guest_passes = null
    await expect(getBookingQuote('user-1', { teeTimeId: 'tt-1', players: 2, guestPassId: 'pass-1' }, false)).rejects.toThrow('guest pass')
  })
  it('enforces mandatory carts and ignores a walking selection', async () => {
    db.rows.course_tee_sheet_config = { cart_policy: 'mandatory' }
    expect((await getBookingQuote('user-1', { teeTimeId: 'tt-1', players: 1, cartSelected: false }, false)).total_charged_cents).toBe(6000)
  })
  it('rejects points and credit overspending', async () => {
    await expect(getBookingQuote('user-1', { teeTimeId: 'tt-1', players: 1, pointsRedeemed: 1001 }, false)).rejects.toThrow('Insufficient points')
    await expect(getBookingQuote('user-1', { teeTimeId: 'tt-1', players: 1, creditsRedeemedCents: 1001 }, false)).rejects.toThrow('Insufficient credits')
  })
  it('checks rain-check ownership and course before subtracting it', async () => {
    const q = await getBookingQuote('user-1', { teeTimeId: 'tt-1', players: 1, rainCheckId: 'rc-1' }, false)
    expect(q.total_charged_cents).toBe(3000)
    expect(db.filters).toContainEqual({ table: 'rain_checks', key: 'user_id', value: 'user-1' })
    expect(db.filters).toContainEqual({ table: 'rain_checks', key: 'course_id', value: 'course-1' })
  })
  it('fails closed when the membership query fails', async () => {
    db.failures.memberships = { message: 'database unavailable' }
    await expect(getBookingQuote('user-1', { teeTimeId: 'tt-1', players: 1 }, false)).rejects.toThrow('Unable to calculate')
  })
})
