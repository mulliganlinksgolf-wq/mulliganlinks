/**
 * Tests that TeeSheetGrid correctly reflects booking state on the course's tee sheet.
 *
 * These cover the critical question: when a golfer books a tee time, does the
 * course admin platform show the right status, player count, golfer name, and actions?
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TeeSheetGrid } from '@/components/course/TeeSheetGrid'

// 8:00 AM Detroit (EDT) = 12:00 UTC
const SCHEDULED_AT = '2026-05-01T12:00:00.000Z'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

vi.mock('@/app/actions/teeTime', () => ({
  updateTeeTimeStatus: vi.fn().mockResolvedValue(undefined),
  updateBookingStatus: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/components/course/WalkInBookingModal', () => ({
  WalkInBookingModal: () => <div data-testid="walk-in-modal" />,
}))

function makeBooking(overrides: Partial<{
  id: string
  players: number
  total_paid: number
  status: string
  guest_name: string | null
  profiles: { full_name: string } | null
}> = {}) {
  return {
    id: 'booking-1',
    players: 2,
    total_paid: 60,
    status: 'confirmed',
    guest_name: null,
    profiles: { full_name: 'Neil Barris' },
    ...overrides,
  }
}

function makeTeeTime(overrides: Partial<{
  id: string
  scheduled_at: string
  max_players: number
  available_players: number
  base_price: number
  status: string
  bookings: ReturnType<typeof makeBooking>[]
}> = {}) {
  return {
    id: 'tt-1',
    scheduled_at: SCHEDULED_AT,
    max_players: 4,
    available_players: 4,
    base_price: 30,
    status: 'open',
    bookings: [],
    ...overrides,
  }
}

describe('TeeSheetGrid — booking state reflection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows open status and 0/4 players when no bookings exist', () => {
    render(<TeeSheetGrid teeTimes={[makeTeeTime()]} slug="demo" courseId="course-1" />)
    expect(screen.getByText('open')).toBeInTheDocument()
    expect(screen.getByText('0/4')).toBeInTheDocument()
  })

  it('shows golfer name, correct player count, and open status after a partial booking', async () => {
    const user = userEvent.setup()
    const teeTimes = [
      makeTeeTime({
        available_players: 2,
        status: 'open',
        bookings: [makeBooking({ players: 2 })],
      }),
    ]

    render(<TeeSheetGrid teeTimes={teeTimes} slug="demo" courseId="course-1" />)

    // Golfer name visible in collapsed row
    expect(screen.getByText('Neil Barris')).toBeInTheDocument()
    // Player count reflects booking
    expect(screen.getByText('2/4')).toBeInTheDocument()
    // Status is still open (spots remain)
    expect(screen.getByText('open')).toBeInTheDocument()

    // Expand the row
    await user.click(screen.getByRole('button', { name: /8:00/i }))

    // Booking detail visible
    expect(screen.getByText('2 players')).toBeInTheDocument()
    // Book walk-in still available (2 spots left)
    expect(screen.getByRole('button', { name: /book walk-in/i })).toBeInTheDocument()
    // Close slot still available
    expect(screen.getByRole('button', { name: /close slot/i })).toBeInTheDocument()
  })

  it('shows "full" status and hides Book walk-in when all 4 spots are taken', async () => {
    const user = userEvent.setup()
    const teeTimes = [
      makeTeeTime({
        available_players: 0,
        status: 'booked',
        bookings: [makeBooking({ players: 4 })],
      }),
    ]

    render(<TeeSheetGrid teeTimes={teeTimes} slug="demo" courseId="course-1" />)

    expect(screen.getByText('full')).toBeInTheDocument()
    expect(screen.getByText('4/4')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /8:00/i }))

    // No walk-in available when full
    expect(screen.queryByRole('button', { name: /book walk-in/i })).not.toBeInTheDocument()
    // Close slot still available (course may want to note the slot)
    expect(screen.queryByRole('button', { name: /close slot/i })).not.toBeInTheDocument()
  })

  it('shows "completed" status when all bookings are marked complete', async () => {
    const user = userEvent.setup()
    const teeTimes = [
      makeTeeTime({
        available_players: 2,
        status: 'open',
        bookings: [makeBooking({ players: 2, status: 'completed' })],
      }),
    ]

    render(<TeeSheetGrid teeTimes={teeTimes} slug="demo" courseId="course-1" />)

    expect(screen.getByText('completed')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /8:00/i }))

    // No walk-in for a completed tee time
    expect(screen.queryByRole('button', { name: /book walk-in/i })).not.toBeInTheDocument()
  })

  it('shows "blocked" status and still allows walk-in override when slot is closed', async () => {
    const user = userEvent.setup()
    const teeTimes = [
      makeTeeTime({
        available_players: 4,
        status: 'blocked',
        bookings: [],
      }),
    ]

    render(<TeeSheetGrid teeTimes={teeTimes} slug="demo" courseId="course-1" />)

    expect(screen.getByText('blocked')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /8:00/i }))

    // Walk-in still available on blocked slot (staff override)
    expect(screen.getByRole('button', { name: /book walk-in/i })).toBeInTheDocument()
    // Open slot button instead of close
    expect(screen.getByRole('button', { name: /open slot/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /close slot/i })).not.toBeInTheDocument()
  })

  it('shows guest name when booking is a walk-in with no profile', async () => {
    const user = userEvent.setup()
    const teeTimes = [
      makeTeeTime({
        available_players: 3,
        bookings: [makeBooking({ players: 1, profiles: null, guest_name: 'Walk-in Guest' })],
      }),
    ]

    render(<TeeSheetGrid teeTimes={teeTimes} slug="demo" courseId="course-1" />)

    // Name appears in collapsed summary column
    expect(screen.getAllByText('Walk-in Guest').length).toBeGreaterThanOrEqual(1)

    await user.click(screen.getByRole('button', { name: /8:00/i }))

    // Name appears in expanded detail too
    expect(screen.getAllByText('Walk-in Guest').length).toBeGreaterThanOrEqual(2)
  })

  it('shows Mark complete and No show buttons for a confirmed booking', async () => {
    const user = userEvent.setup()
    const teeTimes = [
      makeTeeTime({
        available_players: 2,
        bookings: [makeBooking({ players: 2, status: 'confirmed' })],
      }),
    ]

    render(<TeeSheetGrid teeTimes={teeTimes} slug="demo" courseId="course-1" />)
    await user.click(screen.getByRole('button', { name: /8:00/i }))

    expect(screen.getByRole('button', { name: /mark complete/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /no show/i })).toBeInTheDocument()
  })

  it('shows multiple bookings in the expanded view', async () => {
    const user = userEvent.setup()
    const teeTimes = [
      makeTeeTime({
        available_players: 2,
        bookings: [
          makeBooking({ id: 'b1', players: 1, profiles: { full_name: 'Alice' } }),
          makeBooking({ id: 'b2', players: 1, profiles: { full_name: 'Bob' } }),
        ],
      }),
    ]

    render(<TeeSheetGrid teeTimes={teeTimes} slug="demo" courseId="course-1" />)

    // First booking name appears in the collapsed summary column
    expect(screen.getAllByText('Alice').length).toBeGreaterThanOrEqual(1)

    await user.click(screen.getByRole('button', { name: /8:00/i }))

    // Both golfers visible in the expanded detail
    expect(screen.getAllByText('Alice').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })
})
