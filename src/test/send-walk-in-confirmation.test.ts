import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const { mockSendEmail } = vi.hoisted(() => ({
  mockSendEmail: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/emails', () => ({
  sendBookingConfirmation: vi.fn(),
  sendCourseBookingAlert: vi.fn(),
  sendPhoneBookingConfirmation: mockSendEmail,
}))

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

import { createClient } from '@/lib/supabase/server'
import { sendWalkInConfirmation } from '@/app/actions/teeTime'

function buildMock(booking: Record<string, unknown> | null) {
  const updateChain = {
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
  }
  const client = {
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnValue(updateChain),
      single: vi.fn().mockResolvedValue(
        table === 'bookings'
          ? {
              data: booking,
              error: booking ? null : { message: 'not found' },
            }
          : { data: null, error: null }
      ),
    })),
  }
  return client
}

describe('sendWalkInConfirmation', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns error when booking not found', async () => {
    vi.mocked(createClient).mockResolvedValue(buildMock(null) as never)
    const result = await sendWalkInConfirmation({ bookingId: 'b-1', email: 'x@y.com' })
    expect(result.error).toBeTruthy()
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('calls sendPhoneBookingConfirmation with correct args when booking found', async () => {
    const booking = {
      id: 'b-1',
      guest_name: 'Bob Jones',
      players: 2,
      total_paid: 170,
      payment_method: 'cash',
      tee_times: {
        scheduled_at: '2026-05-01T14:00:00Z',
        courses: { name: 'Fieldstone Golf Club' },
      },
    }
    vi.mocked(createClient).mockResolvedValue(buildMock(booking) as never)
    const result = await sendWalkInConfirmation({ bookingId: 'b-1', email: 'bob@example.com' })
    expect(result.error).toBeUndefined()
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        guestName: 'Bob Jones',
        guestEmail: 'bob@example.com',
        courseName: 'Fieldstone Golf Club',
        players: 2,
        totalPaid: 170,
        paymentMethod: 'cash',
      })
    )
  })
})
