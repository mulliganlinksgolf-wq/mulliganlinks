import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import GolferEscapeBanner from '@/components/home/GolferEscapeBanner'

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

vi.mock('@vercel/analytics', () => ({
  track: vi.fn(),
}))

describe('GolferEscapeBanner', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders the banner copy when not dismissed', () => {
    render(<GolferEscapeBanner />)
    expect(screen.getByText(/Looking to play, not run a course/i)).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /Get on the loyalty waitlist/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/waitlist/golfer')
  })

  it('hides itself when the localStorage flag is set', () => {
    window.localStorage.setItem('teeahead.golfer-banner-dismissed', 'true')
    render(<GolferEscapeBanner />)
    expect(screen.queryByText(/Looking to play, not run a course/i)).not.toBeInTheDocument()
  })

  it('renders the banner when localStorage throws (private-mode-style failure)', () => {
    const original = window.localStorage.getItem
    Object.defineProperty(window.localStorage, 'getItem', {
      configurable: true,
      value: () => { throw new Error('private mode') },
    })
    try {
      render(<GolferEscapeBanner />)
      expect(screen.getByText(/Looking to play, not run a course/i)).toBeInTheDocument()
    } finally {
      Object.defineProperty(window.localStorage, 'getItem', { configurable: true, value: original })
    }
  })
})
