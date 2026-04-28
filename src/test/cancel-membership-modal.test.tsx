import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@/app/admin/users/[userId]/actions', () => ({
  cancelMembership: vi.fn().mockResolvedValue({ success: true }),
}))

import CancelMembershipModal from '@/components/admin/CancelMembershipModal'

describe('CancelMembershipModal', () => {
  it('renders Cancel Membership button when member has subscription', () => {
    render(<CancelMembershipModal userId="user-1" periodEndDate="2026-05-01T00:00:00Z" hasMembership={true} />)
    expect(screen.getByText(/cancel membership/i)).toBeInTheDocument()
  })

  it('renders nothing when hasMembership is false', () => {
    const { container } = render(<CancelMembershipModal userId="user-1" periodEndDate={null} hasMembership={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('opens modal on button click', () => {
    render(<CancelMembershipModal userId="user-1" periodEndDate="2026-05-01T00:00:00Z" hasMembership={true} />)
    fireEvent.click(screen.getByText(/cancel membership/i))
    expect(screen.getByText(/cancel \+ refund now/i)).toBeInTheDocument()
    expect(screen.getByText(/cancel at period end/i)).toBeInTheDocument()
  })

  it('shows formatted period end date in modal', () => {
    render(<CancelMembershipModal userId="user-1" periodEndDate="2026-05-01T00:00:00Z" hasMembership={true} />)
    fireEvent.click(screen.getByText(/cancel membership/i))
    expect(screen.getByText(/april 30, 2026/i)).toBeInTheDocument()
  })

  it('closes modal when Keep Membership is clicked', () => {
    render(<CancelMembershipModal userId="user-1" periodEndDate="2026-05-01T00:00:00Z" hasMembership={true} />)
    fireEvent.click(screen.getByText(/cancel membership/i))
    fireEvent.click(screen.getByText(/keep membership/i))
    expect(screen.queryByText(/cancel \+ refund now/i)).not.toBeInTheDocument()
  })
})
