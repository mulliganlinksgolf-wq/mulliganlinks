import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@/app/admin/users/[userId]/actions', () => ({
  saveProfile: vi.fn().mockResolvedValue({ success: true }),
  addNote: vi.fn().mockResolvedValue({ success: true }),
  addCredit: vi.fn().mockResolvedValue({ success: true }),
  adjustPoints: vi.fn().mockResolvedValue({ success: true }),
}))

const baseProps = {
  userId: 'user-1',
  profile: {
    id: 'user-1', full_name: 'Jane Doe', email: 'jane@example.com',
    phone: null, home_course_id: null, is_admin: false,
    founding_member: false, stripe_customer_id: null,
    created_at: '2026-01-01T00:00:00Z',
  },
  membership: {
    id: 'mem-1', tier: 'eagle', status: 'active',
    stripe_subscription_id: 'sub_abc', stripe_customer_id: 'cus_abc',
    current_period_end: '2026-05-01T00:00:00Z',
    cancel_at_period_end: false, created_at: '2026-01-01T00:00:00Z',
  },
  bookings: [],
  credits: [],
  points: [],
  notes: [],
  courses: [],
  homeCourse: null,
}

import MemberDetailTabs from '@/components/admin/MemberDetailTabs'

describe('MemberDetailTabs', () => {
  it('renders all 7 tab buttons', () => {
    render(<MemberDetailTabs {...baseProps} />)
    expect(screen.getByRole('button', { name: /profile/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /membership/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /payments/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /bookings/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /credits/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /points/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /notes/i })).toBeInTheDocument()
  })

  it('shows Profile tab content by default', () => {
    render(<MemberDetailTabs {...baseProps} />)
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
  })

  it('switches to Membership tab on click', () => {
    render(<MemberDetailTabs {...baseProps} />)
    fireEvent.click(screen.getByRole('button', { name: /membership/i }))
    expect(screen.getByText(/stripe subscription id/i)).toBeInTheDocument()
  })

  it('switches to Notes tab on click', () => {
    render(<MemberDetailTabs {...baseProps} />)
    fireEvent.click(screen.getByRole('button', { name: /notes/i }))
    expect(screen.getByPlaceholderText(/write a note/i)).toBeInTheDocument()
  })
})
