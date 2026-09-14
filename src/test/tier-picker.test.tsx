import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TierPicker } from '@/app/waitlist/golfer/TierPicker'

vi.mock('@/app/waitlist/golfer/GolferWaitlistForm', () => ({
  GolferWaitlistForm: () => <div data-testid="waitlist-form" />,
}))

const tiers = [
  {
    key: 'fairway',
    name: 'Fairway',
    price: '$0',
    period: 'forever',
    badge: null,
    features: ['Book tee times at partner courses', '1× Fairway Points per dollar'],
  },
  {
    key: 'eagle',
    name: 'Eagle',
    price: '$89',
    period: '/yr',
    badge: 'Most Popular',
    features: ['1.5× Fairway Points per dollar', 'Priority booking: 48hr early access'],
  },
  {
    key: 'ace',
    name: 'Ace',
    price: '$159',
    period: '/yr',
    badge: null,
    features: ['2× Fairway Points per dollar', 'Priority booking: 72hr early access'],
  },
]

describe('TierPicker', () => {
  it('shows 1.5x for Eagle and never shows the old 2x Eagle multiplier', () => {
    render(<TierPicker tiers={tiers} initialTier="fairway" />)
    expect(screen.getByText(/1\.5× Fairway Points per dollar/i)).toBeInTheDocument()
    // 3x should never appear (old Ace value)
    expect(screen.queryByText(/3× Fairway Points per dollar/i)).not.toBeInTheDocument()
  })

  it('shows 2x for Ace and never shows the old 3x Ace multiplier', () => {
    render(<TierPicker tiers={tiers} initialTier="fairway" />)
    expect(screen.getByText(/2× Fairway Points per dollar/i)).toBeInTheDocument()
    expect(screen.queryByText(/3× Fairway Points per dollar/i)).not.toBeInTheDocument()
  })

  it('shows fine print about course variation', () => {
    render(<TierPicker tiers={tiers} initialTier="fairway" />)
    expect(
      screen.getByText(/each course varies on how they would like to promote their deals/i)
    ).toBeInTheDocument()
  })
})
