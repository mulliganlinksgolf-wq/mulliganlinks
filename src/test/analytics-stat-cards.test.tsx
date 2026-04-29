import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AnalyticsStatCards from '@/components/admin/AnalyticsStatCards'

const props = {
  mrr: 4876,
  totalMembers: 47,
  churnRate: 4,
  avgRevenuePerMember: 119,
}

describe('AnalyticsStatCards', () => {
  it('renders MRR in dollars', () => {
    render(<AnalyticsStatCards {...props} />)
    expect(screen.getByText('$4,876')).toBeInTheDocument()
  })

  it('renders MRR label', () => {
    render(<AnalyticsStatCards {...props} />)
    expect(screen.getByText(/monthly recurring revenue/i)).toBeInTheDocument()
  })

  it('renders total members count', () => {
    render(<AnalyticsStatCards {...props} />)
    expect(screen.getByText('47')).toBeInTheDocument()
  })

  it('renders churn rate as percentage', () => {
    render(<AnalyticsStatCards {...props} />)
    expect(screen.getByText('4%')).toBeInTheDocument()
  })

  it('renders avg revenue per member', () => {
    render(<AnalyticsStatCards {...props} />)
    expect(screen.getByText('$119')).toBeInTheDocument()
  })
})
