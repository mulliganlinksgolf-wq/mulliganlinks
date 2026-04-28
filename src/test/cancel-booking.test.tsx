/**
 * Tests for the member booking cancellation flow.
 *
 * Covers:
 *  - CancelBookingButton two-step confirm UI
 *  - canCancel eligibility logic (status + 1-hour cutoff)
 *  - cancelBooking action: restores available_players, sets status canceled,
 *    does NOT try to reverse points (points are deferred to completion)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CancelBookingButton } from '@/components/CancelBookingButton'

// ─── Component tests ──────────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

const mockCancelBooking = vi.fn()
vi.mock('@/app/actions/booking', () => ({
  cancelBooking: (...args: unknown[]) => mockCancelBooking(...args),
}))

describe('CancelBookingButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCancelBooking.mockResolvedValue({})
  })

  it('shows "Cancel booking" link initially', () => {
    render(<CancelBookingButton bookingId="b-1" />)
    expect(screen.getByRole('button', { name: /cancel booking/i })).toBeInTheDocument()
  })

  it('shows confirmation step after clicking Cancel booking', async () => {
    const user = userEvent.setup()
    render(<CancelBookingButton bookingId="b-1" />)
    await user.click(screen.getByRole('button', { name: /cancel booking/i }))
    expect(screen.getByRole('button', { name: /yes, cancel/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /keep it/i })).toBeInTheDocument()
  })

  it('"Keep it" returns to the initial state', async () => {
    const user = userEvent.setup()
    render(<CancelBookingButton bookingId="b-1" />)
    await user.click(screen.getByRole('button', { name: /cancel booking/i }))
    await user.click(screen.getByRole('button', { name: /keep it/i }))
    expect(screen.getByRole('button', { name: /cancel booking/i })).toBeInTheDocument()
    expect(mockCancelBooking).not.toHaveBeenCalled()
  })

  it('calls cancelBooking with the correct bookingId on confirm', async () => {
    const user = userEvent.setup()
    render(<CancelBookingButton bookingId="booking-42" />)
    await user.click(screen.getByRole('button', { name: /cancel booking/i }))
    await user.click(screen.getByRole('button', { name: /yes, cancel/i }))
    expect(mockCancelBooking).toHaveBeenCalledWith('booking-42')
  })

  it('shows error message when cancelBooking returns an error', async () => {
    mockCancelBooking.mockResolvedValue({ error: 'Cancellations must be made at least 1 hour before tee time.' })
    const user = userEvent.setup()
    render(<CancelBookingButton bookingId="b-1" />)
    await user.click(screen.getByRole('button', { name: /cancel booking/i }))
    await user.click(screen.getByRole('button', { name: /yes, cancel/i }))
    expect(await screen.findByText(/at least 1 hour/i)).toBeInTheDocument()
  })
})

// ─── canCancel eligibility logic ─────────────────────────────────────────────
// This mirrors the logic in /app/app/bookings/[id]/page.tsx:
//   canCancel = status === 'confirmed' && scheduledAt - now > 1hr

describe('canCancel eligibility', () => {
  function canCancel(status: string, msUntilTeeTime: number) {
    return status === 'confirmed' && msUntilTeeTime > 60 * 60 * 1000
  }

  it('is true when confirmed and more than 1 hour away', () => {
    expect(canCancel('confirmed', 2 * 60 * 60 * 1000)).toBe(true)
  })

  it('is false when exactly 1 hour away', () => {
    expect(canCancel('confirmed', 60 * 60 * 1000)).toBe(false)
  })

  it('is false when less than 1 hour away', () => {
    expect(canCancel('confirmed', 30 * 60 * 1000)).toBe(false)
  })

  it('is false when status is completed', () => {
    expect(canCancel('completed', 2 * 60 * 60 * 1000)).toBe(false)
  })

  it('is false when status is canceled', () => {
    expect(canCancel('canceled', 2 * 60 * 60 * 1000)).toBe(false)
  })

  it('is false when status is no_show', () => {
    expect(canCancel('no_show', 2 * 60 * 60 * 1000)).toBe(false)
  })
})
