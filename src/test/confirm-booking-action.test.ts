vi.mock('@/lib/booking-lifecycle', () => ({ reconcileReservations: vi.fn().mockResolvedValue({}), cancelReservation: vi.fn() }))
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockDatabase } from './helpers/database'
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/emails', () => ({ sendBookingConfirmation: vi.fn().mockResolvedValue(undefined), sendCourseBookingAlert: vi.fn().mockResolvedValue(undefined) }))
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { confirmBooking, createPendingBooking } from '@/app/actions/booking'
let db: ReturnType<typeof mockDatabase>
beforeEach(() => {
  db = mockDatabase({
    tee_times: { id: 'tt-1', course_id: 'course-1', status: 'open', scheduled_at: '2099-06-20T16:00:00Z', available_players: 4, base_price: 50 },
    courses: { id: 'course-1', stripe_charges_enabled: false }, memberships: { tier: 'free' },
    fairway_points: [], course_pricing: [],
  })
  vi.mocked(createClient).mockResolvedValue(db.client as never)
  vi.mocked(createAdminClient).mockReturnValue(db.client as never)
})
describe('booking action trust boundary', () => {
  it('does not trust browser totals, points awards or claimed paid tier', async () => {
    const result = await confirmBooking({ teeTimeId: 'tt-1', players: 2, total: 0, pointsEarned: 999999, tier: 'ace' })
    expect(result.bookingId).toBe('booking-1')
    expect(db.client.rpc).toHaveBeenCalledWith('create_member_booking', { p_quote: expect.objectContaining({
      user_id: 'user-1', total_charged_cents: 10000, points_awarded: 100, tier: 'free', status: 'confirmed',
    }) })
  })
  it('rejects another user ID before privileged queries', async () => {
    expect(await confirmBooking({ teeTimeId: 'tt-1', players: 1, userId: 'someone-else' })).toEqual({ error: 'Not authorized' })
    expect(db.client.rpc).not.toHaveBeenCalled()
    expect(db.client.from).not.toHaveBeenCalled()
  })
  it('rejects anonymous calls', async () => {
    db.client.auth.getUser.mockResolvedValue({ data: { user: null } })
    expect(await createPendingBooking({ teeTimeId: 'tt-1', players: 1 })).toEqual({ error: 'Not authenticated' })
    expect(db.client.rpc).not.toHaveBeenCalled()
  })
  it('reports a competing booking that filled the slot', async () => {
    db.client.rpc.mockResolvedValue({ data: null, error: { code: '23514' } } as never)
    expect(await confirmBooking({ teeTimeId: 'tt-1', players: 2 })).toEqual({ error: 'slot_filled' })
  })
  it('does not fall back to a direct insert when the migration is missing', async () => {
    db.client.rpc.mockResolvedValue({ data: null, error: { code: 'PGRST202' } } as never)
    expect((await confirmBooking({ teeTimeId: 'tt-1', players: 2 })).error).toBeTruthy()
    expect(db.writes).toHaveLength(0)
  })
})
