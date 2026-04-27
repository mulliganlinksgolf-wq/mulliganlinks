/**
 * Component tests for BarterPage.
 * Validates: rendering, slider interaction, output card, legal disclaimers,
 * source citations, share buttons, and spots-remaining states.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { BarterPage } from '@/components/BarterPage'

// Mock next/link — renders as <a> with href
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

// Mock TeeAheadLogo
vi.mock('@/components/TeeAheadLogo', () => ({
  TeeAheadLogo: ({ className }: { className?: string }) => (
    <img src="/brand/teeahead-logo-final.png" alt="TeeAhead" className={className} />
  ),
}))

// Mock FadeIn — renders children directly
vi.mock('@/components/FadeIn', () => ({
  FadeIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: vi.fn().mockResolvedValue(undefined) },
  writable: true,
})

describe('BarterPage — rendering', () => {
  it('renders the hero headline', () => {
    render(<BarterPage spotsRemaining={10} />)
    expect(screen.getByText(/What has GolfNow actually cost you/i)).toBeInTheDocument()
  })

  it('renders all three sliders', () => {
    render(<BarterPage spotsRemaining={10} />)
    const sliders = screen.getAllByRole('slider')
    expect(sliders).toHaveLength(3)
  })

  it('renders the output card with initial cost', () => {
    render(<BarterPage spotsRemaining={10} />)
    // Default: $85 × 280 × 2 = $47,600
    expect(screen.getByText(/GolfNow.+barter model cost you/i)).toBeInTheDocument()
    expect(screen.getByText('$0')).toBeInTheDocument() // TeeAhead cost
  })

  it('renders the "$0 TeeAhead" label in the output card', () => {
    render(<BarterPage spotsRemaining={10} />)
    expect(screen.getByText(/TeeAhead would have charged you/i)).toBeInTheDocument()
  })
})

describe('BarterPage — proof section legal citations', () => {
  it('shows Windsor Parke source attribution', () => {
    render(<BarterPage spotsRemaining={10} />)
    expect(screen.getByText(/Golf Inc\. \/ industry reporting/i)).toBeInTheDocument()
  })

  it('shows Brown Golf NGCOA attribution', () => {
    render(<BarterPage spotsRemaining={10} />)
    expect(screen.getByText(/NGCOA member reporting/i)).toBeInTheDocument()
  })

  it('shows NGCOA Q1 2025 attribution for exodus stat', () => {
    render(<BarterPage spotsRemaining={10} />)
    expect(screen.getByText(/National Golf Course Owners Association.*Q1 2025/i)).toBeInTheDocument()
  })

  it('shows calculator disclaimer text', () => {
    render(<BarterPage spotsRemaining={10} />)
    expect(screen.getByText(/Calculation based on GolfNow.+standard barter model/i)).toBeInTheDocument()
  })

  it('shows the hero source footnote', () => {
    render(<BarterPage spotsRemaining={10} />)
    expect(screen.getByText(/NGCOA member survey data and Golf Inc\. industry analysis/i)).toBeInTheDocument()
  })
})

describe('BarterPage — legal footer disclaimer', () => {
  it('shows the not-affiliated disclaimer', () => {
    render(<BarterPage spotsRemaining={10} />)
    expect(screen.getByText(/not affiliated with or endorsed by GolfNow/i)).toBeInTheDocument()
  })

  it('mentions NBC Sports Next in disclaimer', () => {
    render(<BarterPage spotsRemaining={10} />)
    expect(screen.getByText(/NBC Sports Next/i)).toBeInTheDocument()
  })
})

describe('BarterPage — founding spots states', () => {
  it('shows "Claim a Founding Partner Spot" when spots > 5', () => {
    render(<BarterPage spotsRemaining={10} />)
    expect(screen.getByText(/Claim a Founding Partner Spot/i)).toBeInTheDocument()
  })

  it('shows spots remaining when spots > 0', () => {
    render(<BarterPage spotsRemaining={7} />)
    expect(screen.getByText(/7 of 10 spots are left/i)).toBeInTheDocument()
  })

  it('switches to waitlist CTA when all spots claimed', () => {
    render(<BarterPage spotsRemaining={0} />)
    expect(screen.getByText(/Join the Course Waitlist/i)).toBeInTheDocument()
    expect(screen.queryByText(/Claim a Founding Partner Spot/i)).not.toBeInTheDocument()
  })

  it('hides spots remaining text when all claimed', () => {
    render(<BarterPage spotsRemaining={0} />)
    expect(screen.queryByText(/spots are left/i)).not.toBeInTheDocument()
  })
})

describe('BarterPage — share buttons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Copy Link button', () => {
    render(<BarterPage spotsRemaining={5} />)
    expect(screen.getByRole('button', { name: /Copy Link/i })).toBeInTheDocument()
  })

  it('renders Share via Email link', () => {
    render(<BarterPage spotsRemaining={5} />)
    const emailLink = screen.getByRole('link', { name: /Share via Email/i })
    expect(emailLink).toHaveAttribute('href', expect.stringContaining('mailto:'))
  })

  it('email mailto includes correct subject', () => {
    render(<BarterPage spotsRemaining={5} />)
    const emailLink = screen.getByRole('link', { name: /Share via Email/i })
    // encodeURIComponent encodes spaces as %20
    expect(emailLink.getAttribute('href')).toContain('Worth%20checking')
  })

  it('Copy Link writes the barter URL to clipboard', async () => {
    render(<BarterPage spotsRemaining={5} />)
    const copyBtn = screen.getByRole('button', { name: /Copy Link/i })
    await act(async () => { fireEvent.click(copyBtn) })
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://teeahead.com/barter')
  })

  it('Copy Link shows "Copied!" after clicking', async () => {
    render(<BarterPage spotsRemaining={5} />)
    const copyBtn = screen.getByRole('button', { name: /Copy Link/i })
    await act(async () => { fireEvent.click(copyBtn) })
    expect(screen.getByRole('button', { name: /Copied!/i })).toBeInTheDocument()
  })
})
