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

  it('migration question mentions EZLinks and there is a mailto:billy link', () => {
    render(<HomepageFaq />)
    expect(
      screen.getByText(/What if my course already uses EZLinks/i)
    ).toBeInTheDocument()
    // Footer link to billy reachable from this section
    const billyLink = screen.getByRole('link', { name: /Email Billy/i })
    expect(billyLink).toHaveAttribute('href', 'mailto:billy@teeahead.com')
  })

  it('splits FAQs into operator + golfer columns', () => {
    render(<HomepageFaq />)
    expect(screen.getByText(/For course operators/i)).toBeInTheDocument()
    expect(screen.getByText(/For golfers/i)).toBeInTheDocument()
  })
})
