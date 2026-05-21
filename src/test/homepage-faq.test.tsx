import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { HomepageFaq } from '@/components/HomepageFaq'

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('HomepageFaq', () => {
  it('renders the founding-partner pricing question', () => {
    render(<HomepageFaq />)
    expect(
      screen.getByText(/Is TeeAhead really free for courses for founding partners\?/i)
    ).toBeInTheDocument()
  })

  it('migration question mentions EZLinks and the billy email', () => {
    render(<HomepageFaq />)
    expect(
      screen.getByText(/What if my course already uses EZLinks/i)
    ).toBeInTheDocument()
    // billy@teeahead.com appears in both the migration answer and the footer link
    const billyLinks = screen.getAllByRole('link', { name: /billy@teeahead\.com/i })
    expect(billyLinks.length).toBeGreaterThanOrEqual(1)
    expect(billyLinks[0]).toHaveAttribute('href', 'mailto:billy@teeahead.com')
  })

  it('splits FAQs into operator + golfer columns', () => {
    render(<HomepageFaq />)
    expect(screen.getByText(/For course operators/i)).toBeInTheDocument()
    expect(screen.getByText(/For golfers/i)).toBeInTheDocument()
  })
})
