/**
 * Tests that confirmBooking() writes the correct data to the DB so the
 * tee sheet reflects the booking properly.
 *
 * Key invariants:
 *  - available_players is decremented by the number of players booked
 *  - status becomes 'booked' when available_players hits 0
 *  - status stays 'open' when spots remain
 *  - booking row is inserted with status 'confirmed'
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/emails', () => ({
  sendBookingConfirmation: vi.fn().mockResolvedValue(undefined),
  sendCourseBookingAlert: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/stripe/fees', () => ({ platformFeeCents: vi.fn().mockReturnValue(0) }))

// Capture what the action writes to each table
let teeTimeUpdateArgs: Record<string, unknown> | null = null
let bookingInsertArgs: Record<string, unknown> | null = null

function buildSupabaseMock({
  availablePlayers,
  maxPlayers = 4,
  status = 'open',
}: {
  availablePlayers: number
  maxPlayers?: number
  status?: string
}) {
  teeTimeUpdateArgs = null
  bookingInsertArgs = null

  const teeTimeRow = {
    id: 'tt-1',
    available_players: availablePlayers,
    max_players: maxPlayers,
    status,
    base_price: 30,
    course_id: 'course-1',
  }

  const bookingRow = { id: 'booking-99' }

  // Builder that records calls and allows chaining
  function makeChain(resolvedData: unknown, table: 'tee_times' | 'bookings') {
    let pendingUpdate: Record<string, unknown> | null = null
    let pendingInsert: Record<string, unknown> | null = null

    const chain: Record<string, unknown> = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: resolvedData, error: null }),
      update: vi.fn((args: Record<string, unknown>) => {
        pendingUpdate = args
        if (table === 'tee_times') teeTimeUpdateArgs = args
        return chain
      }),
      insert: vi.fn((args: Record<string, unknown>) => {
        pendingInsert = args
        if (table === 'bookings') bookingInsertArgs = args
        return chain
      }),
    }
    // select after insert needs to return booking id
    ;(chain.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
      if (pendingInsert) return chain
      return chain
    })
    ;(chain.single as ReturnType<typeof vi.fn>).mockImplementation(() => {
      if (pendingInsert && table === 'bookings') {
        return Promise.resolve({ data: bookingRow, error: null })
      }
      return Promise.resolve({ data: resolvedData, error: null })
    })
    return chain
  }

  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    },
    from: vi.fn((table: string) => makeChain(
      table === 'tee_times' ? teeTimeRow : bookingRow,
      table as 'tee_times' | 'bookings',
    )),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  }

  return client
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { confirmBooking } from '@/app/actions/booking'

describe('confirmBooking — tee sheet reflection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('decrements available_players by the number of players booked', async () => {
    const mock = buildSupabaseMock({ availablePlayers: 4 })
    vi.mocked(createClient).mockResolvedValue(mock as never)
    vi.mocked(createAdminClient).mockReturnValue(mock as never)

    await confirmBooking({
      teeTimeId: 'tt-1',
      userId: 'user-1',
      players: 2,
      subtotal: 60,
      discount: 0,
      pointsRedeemed: 0,
      total: 60,
      pointsEarned: 0,
      tier: 'free',
    })

    expect(teeTimeUpdateArgs).toMatchObject({ available_players: 2 })
  })

  it('sets status to "booked" when all spots are taken', async () => {
    const mock = buildSupabaseMock({ availablePlayers: 2 })
    vi.mocked(createClient).mockResolvedValue(mock as never)
    vi.mocked(createAdminClient).mockReturnValue(mock as never)

    await confirmBooking({
      teeTimeId: 'tt-1',
      userId: 'user-1',
      players: 2,
      subtotal: 60,
      discount: 0,
      pointsRedeemed: 0,
      total: 60,
      pointsEarned: 0,
      tier: 'free',
    })

    expect(teeTimeUpdateArgs).toMatchObject({ available_players: 0, status: 'booked' })
  })

  it('keeps status "open" when spots remain after booking', async () => {
    const mock = buildSupabaseMock({ availablePlayers: 4 })
    vi.mocked(createClient).mockResolvedValue(mock as never)
    vi.mocked(createAdminClient).mockReturnValue(mock as never)

    await confirmBooking({
      teeTimeId: 'tt-1',
      userId: 'user-1',
      players: 1,
      subtotal: 30,
      discount: 0,
      pointsRedeemed: 0,
      total: 30,
      pointsEarned: 0,
      tier: 'free',
    })

    expect(teeTimeUpdateArgs).toMatchObject({ available_players: 3, status: 'open' })
  })

  it('inserts booking with status "confirmed"', async () => {
    const mock = buildSupabaseMock({ availablePlayers: 4 })
    vi.mocked(createClient).mockResolvedValue(mock as never)
    vi.mocked(createAdminClient).mockReturnValue(mock as never)

    await confirmBooking({
      teeTimeId: 'tt-1',
      userId: 'user-1',
      players: 2,
      subtotal: 60,
      discount: 0,
      pointsRedeemed: 0,
      total: 60,
      pointsEarned: 0,
      tier: 'free',
    })

    expect(bookingInsertArgs).toMatchObject({
      tee_time_id: 'tt-1',
      user_id: 'user-1',
      players: 2,
      status: 'confirmed',
    })
  })

  it('returns an error and does not update tee time when slot is unavailable', async () => {
    const mock = buildSupabaseMock({ availablePlayers: 1, status: 'open' })
    vi.mocked(createClient).mockResolvedValue(mock as never)
    vi.mocked(createAdminClient).mockReturnValue(mock as never)

    const result = await confirmBooking({
      teeTimeId: 'tt-1',
      userId: 'user-1',
      players: 2, // more than available
      subtotal: 60,
      discount: 0,
      pointsRedeemed: 0,
      total: 60,
      pointsEarned: 0,
      tier: 'free',
    })

    expect(result.error).toBeTruthy()
    expect(teeTimeUpdateArgs).toBeNull()
  })
})
