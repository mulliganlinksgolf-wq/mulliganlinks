import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { PublicTeeTimeGrid } from '@/app/book/[slug]/PublicTeeTimeGrid'

// 7:30 AM and 8:00 AM Detroit (EDT = UTC-4)
const MORNING_EARLY = '2026-05-01T11:30:00.000Z'
const MORNING_LATE  = '2026-05-01T12:00:00.000Z'

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

function makeTT(overrides: Partial<{
  id: string
  scheduled_at: string
  available_players: number
  base_price: number
  special_price: number | null
  special_label: string | null
}> = {}) {
  return {
    id: 'tt-1',
    scheduled_at: MORNING_LATE,
    available_players: 4,
    base_price: 65,
    special_price: null,
    special_label: null,
    ...overrides,
  }
}

const GRID_PROPS = {
  courseName: 'Demo Course',
  courseSlug: 'demo',
  selectedDate: '2026-05-01',
}

describe('PublicTeeTimeGrid — featured deal cards', () => {
  it('shows base price normally when no deal is set', () => {
    render(<PublicTeeTimeGrid teeTimes={[makeTT()]} {...GRID_PROPS} />)
    expect(screen.getByText('$65.00')).toBeInTheDocument()
    expect(screen.queryByText(/save/i)).not.toBeInTheDocument()
  })

  it('shows strikethrough base price when a deal is set', () => {
    render(<PublicTeeTimeGrid teeTimes={[makeTT({ special_price: 45 })]} {...GRID_PROPS} />)
    const strikethrough = screen.getByText('$65.00')
    expect(strikethrough).toHaveStyle('text-decoration: line-through')
  })

  it('shows the special price in red when a deal is set', () => {
    render(<PublicTeeTimeGrid teeTimes={[makeTT({ special_price: 45 })]} {...GRID_PROPS} />)
    expect(screen.getByText('$45.00')).toBeInTheDocument()
  })

  it('shows "Save $20.00" when base is 65 and special is 45', () => {
    render(<PublicTeeTimeGrid teeTimes={[makeTT({ special_price: 45 })]} {...GRID_PROPS} />)
    expect(screen.getByText('Save $20.00')).toBeInTheDocument()
  })

  it('shows the custom label when special_label is set', () => {
    render(
      <PublicTeeTimeGrid
        teeTimes={[makeTT({ special_price: 45, special_label: 'Twilight Rate' })]}
        {...GRID_PROPS}
      />
    )
    expect(screen.getByText('Twilight Rate')).toBeInTheDocument()
  })

  it('does not show a "Save" line when special_price is higher than base_price', () => {
    render(
      <PublicTeeTimeGrid
        teeTimes={[makeTT({ special_price: 80 })]}
        {...GRID_PROPS}
      />
    )
    expect(screen.queryByText(/save/i)).not.toBeInTheDocument()
  })

  it('sorts featured tee time before non-featured in the same section', () => {
    const teeTimes = [
      makeTT({ id: 'early', scheduled_at: MORNING_EARLY, special_price: null }),
      makeTT({ id: 'late',  scheduled_at: MORNING_LATE,  special_price: 45 }),
    ]
    render(<PublicTeeTimeGrid teeTimes={teeTimes} {...GRID_PROPS} />)
    const cards = screen.getAllByRole('link', { name: /book now/i })
    // The featured 8:00 AM card's link should precede the non-featured 7:30 AM card's link
    const hrefs = cards.map(c => c.getAttribute('href'))
    expect(hrefs[0]).toBe('/app/book/late')
    expect(hrefs[1]).toBe('/app/book/early')
  })
})
