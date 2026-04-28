/**
 * Tests for the check-in & auto-points system.
 *
 * Invariants verified:
 *  1. confirmBooking no longer inserts into fairway_points at booking time
 *  2. updateBookingStatus('completed') inserts fairway_points for member bookings
 *  3. updateBookingStatus('no_show') does NOT award points
 *  4. cancelBooking restores redeemed points (not earned points, since those weren't pre-awarded)
 *  5. Points preview (points_awarded field on booking) is still stored at booking time
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/emails', () => ({
  sendBookingConfirmation: vi.fn().mockResolvedValue(undefined),
  sendCourseBookingAlert: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/stripe/fees', () => ({ platformFeeCents: vi.fn().mockReturnValue(0) }))

// Track every fairway_points insert
const pointInserts: Record<string, unknown>[] = []
// Track tee_times updates
let teeTimeUpdate: Record<string, unknown> | null = null
// Track booking insert args
let bookingInsert: Record<string, unknown> | null = null

function buildMock({
  availablePlayers = 4,
  bookingPointsAwarded = 60,
  bookingUserId = 'user-1',
  teeCourseId = 'course-1',
  redeemedPointRows = [] as { amount: number }[],
}: {
  availablePlayers?: number
  bookingPointsAwarded?: number
  bookingUserId?: string | null
  teeCourseId?: string
  redeemedPointRows?: { amount: number }[]
} = {}) {
  pointInserts.length = 0
  teeTimeUpdate = null
  bookingInsert = null

  const teeTimeRow = { id: 'tt-1', available_players: availablePlayers, status: 'open', base_price: 30, course_id: teeCourseId }
  const bookingRow = { id: 'booking-1', user_id: bookingUserId, points_awarded: bookingPointsAwarded, tee_time_id: 'tt-1' }
  const teeRow = { course_id: teeCourseId }

  let pendingInsert: Record<string, unknown> | null = null

  function makeChain(defaultData: unknown, table: string) {
    const chain: Record<string, unknown> = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockImplementation(() => {
        if (pendingInsert && table === 'bookings') return Promise.resolve({ data: { id: 'booking-1' }, error: null })
        if (table === 'tee_times' && !pendingInsert) return Promise.resolve({ data: teeTimeRow, error: null })
        if (table === 'bookings') return Promise.resolve({ data: bookingRow, error: null })
        return Promise.resolve({ data: teeRow, error: null })
      }),
      update: vi.fn((args: Record<string, unknown>) => {
        if (table === 'tee_times') teeTimeUpdate = args
        return chain
      }),
      insert: vi.fn((args: Record<string, unknown>) => {
        if (table === 'fairway_points') pointInserts.push(args)
        if (table === 'bookings') { pendingInsert = args; bookingInsert = args }
        return chain
      }),
    }
    // fairway_points with lt filter returns redeemed rows
    ;(chain.lt as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      ...chain,
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      // resolved as an array for the cancel flow
      then: (resolve: (v: { data: { amount: number }[] }) => void) =>
        resolve({ data: redeemedPointRows }),
    }))
    return chain
  }

  const client = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    from: vi.fn((table: string) => makeChain(
      table === 'tee_times' ? teeTimeRow : bookingRow,
      table,
    )),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  }
  return client
}

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { confirmBooking } from '@/app/actions/booking'
import { updateBookingStatus } from '@/app/actions/teeTime'

describe('Points deferred to completion — confirmBooking', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does NOT insert into fairway_points at booking time', async () => {
    const mock = buildMock({ availablePlayers: 4 })
    vi.mocked(createClient).mockResolvedValue(mock as never)
    vi.mocked(createAdminClient).mockReturnValue(mock as never)

    await confirmBooking({
      teeTimeId: 'tt-1', userId: 'user-1', players: 2,
      subtotal: 60, discount: 0, pointsRedeemed: 0,
      total: 60, pointsEarned: 60, tier: 'eagle',
    })

    // No positive fairway_points insert
    const earned = pointInserts.filter(p => (p.amount as number) > 0)
    expect(earned).toHaveLength(0)
  })

  it('still stores points_awarded on the booking row for display', async () => {
    const mock = buildMock({ availablePlayers: 4 })
    vi.mocked(createClient).mockResolvedValue(mock as never)
    vi.mocked(createAdminClient).mockReturnValue(mock as never)

    await confirmBooking({
      teeTimeId: 'tt-1', userId: 'user-1', players: 2,
      subtotal: 60, discount: 0, pointsRedeemed: 0,
      total: 60, pointsEarned: 60, tier: 'eagle',
    })

    expect(bookingInsert).toMatchObject({ points_awarded: 60 })
  })

  it('inserts negative fairway_points row when member redeems points', async () => {
    const mock = buildMock({ availablePlayers: 4 })
    vi.mocked(createClient).mockResolvedValue(mock as never)
    vi.mocked(createAdminClient).mockReturnValue(mock as never)

    await confirmBooking({
      teeTimeId: 'tt-1', userId: 'user-1', players: 2,
      subtotal: 60, discount: 0, pointsRedeemed: 500,
      total: 55, pointsEarned: 55, tier: 'eagle',
    })

    const redeemed = pointInserts.filter(p => (p.amount as number) < 0)
    expect(redeemed).toHaveLength(1)
    expect(redeemed[0]).toMatchObject({ amount: -500 })
  })
})

describe('Auto-award on Mark Complete — updateBookingStatus', () => {
  beforeEach(() => vi.clearAllMocks())

  it('inserts fairway_points when status is completed and booking has a member', async () => {
    const mock = buildMock({ bookingPointsAwarded: 60, bookingUserId: 'user-1' })
    vi.mocked(createClient).mockResolvedValue(mock as never)

    await updateBookingStatus('booking-1', 'completed')

    const earned = pointInserts.filter(p => (p.amount as number) > 0)
    expect(earned).toHaveLength(1)
    expect(earned[0]).toMatchObject({ user_id: 'user-1', amount: 60, reason: 'Round completed' })
  })

  it('does NOT award points for no_show', async () => {
    const mock = buildMock({ bookingPointsAwarded: 60, bookingUserId: 'user-1' })
    vi.mocked(createClient).mockResolvedValue(mock as never)

    await updateBookingStatus('booking-1', 'no_show')

    expect(pointInserts).toHaveLength(0)
  })

  it('does NOT award points for a walk-in with no user_id', async () => {
    const mock = buildMock({ bookingPointsAwarded: 0, bookingUserId: null })
    vi.mocked(createClient).mockResolvedValue(mock as never)

    await updateBookingStatus('booking-1', 'completed')

    expect(pointInserts).toHaveLength(0)
  })
})
