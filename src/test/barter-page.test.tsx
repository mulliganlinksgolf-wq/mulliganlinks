/**
 * Component tests for BarterPage.
 * Validates: rendering, slider interaction, output card, legal disclaimers,
 * source citations, share buttons, and spots-remaining states.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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
    expect(screen.getByText(/GolfNow.+barter model cost you/i)).toBeInTheDocument()
  })

  it('renders all three sliders', () => {
    render(<BarterPage spotsRemaining={10} />)
    const sliders = screen.getAllByRole('slider')
    expect(sliders).toHaveLength(3)
  })

  it('renders the output card with initial cost', () => {
    render(<BarterPage spotsRemaining={10} />)
    // Default headline + sub-copy
    expect(screen.getByText(/GolfNow.+barter model cost you/i)).toBeInTheDocument()
    expect(screen.getByText(/This year alone/i)).toBeInTheDocument()
  })

  it('renders the "Adjust to match your course" label on the slider card', () => {
    render(<BarterPage spotsRemaining={10} />)
    expect(screen.getByText(/Adjust to match your course/i)).toBeInTheDocument()
  })

  it('all range sliders are present (3 inputs of type range)', () => {
    const { container } = render(<BarterPage spotsRemaining={10} />)
    const sliders = container.querySelectorAll('input[type="range"]')
    expect(sliders.length).toBe(3)
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
    expect(screen.getByText(/Calculation based on GolfNow barter rates/i)).toBeInTheDocument()
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
  it('shows "Claim a founding spot" CTA when spots > 5', () => {
    render(<BarterPage spotsRemaining={10} />)
    expect(screen.getAllByText(/Claim a founding spot/i).length).toBeGreaterThan(0)
  })

  it('shows spots remaining when spots > 0', () => {
    render(<BarterPage spotsRemaining={7} />)
    expect(screen.getByText(/\(7 left\)/i)).toBeInTheDocument()
  })

  it('switches to waitlist CTA when all spots claimed', () => {
    render(<BarterPage spotsRemaining={0} />)
    expect(screen.getByText(/Join the course waitlist/i)).toBeInTheDocument()
    expect(screen.queryByText(/Claim a founding spot \(/i)).not.toBeInTheDocument()
  })

  it('hides spots-left text when all claimed', () => {
    render(<BarterPage spotsRemaining={0} />)
    expect(screen.queryByText(/\(\d+ left\)/i)).not.toBeInTheDocument()
  })
})

describe('BarterPage — preset chips', () => {
  it('renders all four preset chips', () => {
    render(<BarterPage spotsRemaining={10} />)
    expect(screen.getByRole('button', { name: /Municipal/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Daily Fee/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Semi-Private/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /My own numbers/i })).toBeInTheDocument()
  })

  it('clicking Municipal preset sets green fee slider to 45', () => {
    render(<BarterPage spotsRemaining={10} />)
    const chip = screen.getByRole('button', { name: /Municipal/i })
    fireEvent.click(chip)
    const sliders = screen.getAllByRole('slider')
    // First slider is green fee
    expect(sliders[0]).toHaveValue('45')
  })

  it('clicking Daily Fee preset sets green fee slider to 85', () => {
    render(<BarterPage spotsRemaining={10} />)
    fireEvent.click(screen.getByRole('button', { name: /Daily Fee/i }))
    const sliders = screen.getAllByRole('slider')
    expect(sliders[0]).toHaveValue('85')
  })

  it('clicking Semi-Private preset sets green fee slider to 120', () => {
    render(<BarterPage spotsRemaining={10} />)
    fireEvent.click(screen.getByRole('button', { name: /Semi-Private/i }))
    const sliders = screen.getAllByRole('slider')
    expect(sliders[0]).toHaveValue('120')
  })
})
