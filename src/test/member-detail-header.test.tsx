import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/components/admin/CancelMembershipModal', () => ({
  default: () => <button>Cancel Membership</button>,
}))
vi.mock('@/components/admin/EditTierModal', () => ({
  default: () => <button>Edit Tier</button>,
}))
vi.mock('next/link', () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}))

import MemberDetailHeader from '@/components/admin/MemberDetailHeader'

const baseProps = {
  userId: 'user-1',
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  joinDate: '2026-01-15T00:00:00Z',
  tier: 'eagle',
  status: 'active',
  isFoundingMember: false,
  periodEndDate: null,
  hasMembership: true,
}

describe('MemberDetailHeader', () => {
  it('renders full name', () => {
    render(<MemberDetailHeader {...baseProps} />)
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
  })

  it('renders email', () => {
    render(<MemberDetailHeader {...baseProps} />)
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
  })

  it('renders avatar initials', () => {
    render(<MemberDetailHeader {...baseProps} />)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('renders tier badge', () => {
    render(<MemberDetailHeader {...baseProps} />)
    expect(screen.getByText('eagle')).toBeInTheDocument()
  })

  it('renders founding member badge when founding', () => {
    render(<MemberDetailHeader {...baseProps} isFoundingMember={true} />)
    expect(screen.getByText(/founding/i)).toBeInTheDocument()
  })

  it('does not render founding badge when not founding', () => {
    render(<MemberDetailHeader {...baseProps} isFoundingMember={false} />)
    expect(screen.queryByText(/founding/i)).not.toBeInTheDocument()
  })

  it('renders Edit Tier and Cancel Membership buttons', () => {
    render(<MemberDetailHeader {...baseProps} />)
    expect(screen.getByText('Edit Tier')).toBeInTheDocument()
    expect(screen.getByText('Cancel Membership')).toBeInTheDocument()
  })
})
