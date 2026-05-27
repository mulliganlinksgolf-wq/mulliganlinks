import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@/app/admin/disputes/actions', () => ({
  markDisputeWon: vi.fn().mockResolvedValue({ success: true }),
  markDisputeLost: vi.fn().mockResolvedValue({ success: true }),
  addDisputeNote: vi.fn().mockResolvedValue({ success: true }),
}))

import DisputeList from '@/components/admin/DisputeList'

const baseDispute = {
  id: 'd-1',
  stripe_dispute_id: 'dp_abc123',
  amount_cents: 7900,
  reason: 'fraudulent',
  status: 'open',
  evidence_due_by: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days from now
  created_at: '2026-04-01T00:00:00Z',
  resolved_at: null,
  member_name: 'Dave R.',
  member_email: 'dave@example.com',
  timeline: [],
}

describe('DisputeList', () => {
  it('renders dispute amount', () => {
    render(<DisputeList disputes={[baseDispute]} />)
    expect(screen.getByText('$79.00')).toBeInTheDocument()
  })

  it('renders member name', () => {
    render(<DisputeList disputes={[baseDispute]} />)
    expect(screen.getByText('Dave R.')).toBeInTheDocument()
  })

  it('renders filter tabs', () => {
    render(<DisputeList disputes={[baseDispute]} />)
    expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /open/i })).toBeInTheDocument()
  })

  it('shows urgent banner when deadline ≤ 3 days', () => {
    const urgent = { ...baseDispute, evidence_due_by: new Date(Date.now() + 86400000 * 2).toISOString() }
    render(<DisputeList disputes={[urgent]} />)
    expect(screen.getByText(/urgent/i)).toBeInTheDocument()
  })

  it('does not show urgent banner when deadline > 3 days', () => {
    render(<DisputeList disputes={[baseDispute]} />)
    expect(screen.queryByText(/urgent/i)).not.toBeInTheDocument()
  })

  it('opens detail panel on View click', () => {
    render(<DisputeList disputes={[baseDispute]} />)
    fireEvent.click(screen.getByRole('button', { name: /view/i }))
    expect(screen.getByText('dp_abc123')).toBeInTheDocument()
  })
})
