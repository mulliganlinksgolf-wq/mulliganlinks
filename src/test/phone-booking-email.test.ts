import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Resend before importing emails
const mockSend = vi.fn().mockResolvedValue({ data: { id: 'msg-1' }, error: null })
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(function () { return { emails: { send: mockSend } } }),
}))

// Set env before import
process.env.RESEND_API_KEY = 're_test_key'

import { sendPhoneBookingConfirmation } from '@/lib/emails'

describe('sendPhoneBookingConfirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSend.mockResolvedValue({ data: { id: 'msg-1' }, error: null })
  })

  it('sends an email to the guest address', async () => {
    await sendPhoneBookingConfirmation({
      guestName: 'John Smith',
      guestEmail: 'john@example.com',
      courseName: 'Fieldstone Golf Club',
      teeTimeIso: '2026-05-01T14:00:00Z',
      players: 2,
      totalPaid: 170,
      paymentMethod: 'cash',
    })

    expect(mockSend).toHaveBeenCalledOnce()
    const call = mockSend.mock.calls[0][0]
    expect(call.to).toBe('john@example.com')
    expect(call.subject).toContain('Fieldstone Golf Club')
  })

  it('includes course name, players, and payment method in html', async () => {
    await sendPhoneBookingConfirmation({
      guestName: 'Jane Doe',
      guestEmail: 'jane@example.com',
      courseName: 'Fieldstone Golf Club',
      teeTimeIso: '2026-05-01T14:00:00Z',
      players: 3,
      totalPaid: 255,
      paymentMethod: 'card',
    })

    const html = mockSend.mock.calls[0][0].html as string
    expect(html).toContain('Fieldstone Golf Club')
    expect(html).toContain('3')
    expect(html).toContain('Card')
    expect(html).toContain('$255.00')
  })

  it('does not throw when RESEND_API_KEY is placeholder — just returns', async () => {
    const originalKey = process.env.RESEND_API_KEY
    process.env.RESEND_API_KEY = 're_placeholder'
    await expect(
      sendPhoneBookingConfirmation({
        guestName: 'Test',
        guestEmail: 'test@example.com',
        courseName: 'Test Course',
        teeTimeIso: '2026-05-01T14:00:00Z',
        players: 1,
        totalPaid: 85,
        paymentMethod: 'cash',
      })
    ).resolves.toBeUndefined()
    expect(mockSend).not.toHaveBeenCalled()
    process.env.RESEND_API_KEY = originalKey
  })
})
