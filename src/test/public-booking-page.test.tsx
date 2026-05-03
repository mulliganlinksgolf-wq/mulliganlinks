import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PublicTeeTimeGrid } from '@/app/book/[slug]/PublicTeeTimeGrid'

const BASE_DATE = '2026-05-10'

function makeTeeTime(overrides: Partial<{
  id: string
  scheduled_at: string
  available_players: number
  base_price: number
}> = {}) {
  return {
    id: 'tt-1',
    scheduled_at: `${BASE_DATE}T14:00:00+00:00`,
    available_players: 4,
    base_price: 55,
    ...overrides,
  }
}

describe('PublicTeeTimeGrid', () => {
  it('renders a tee time card with price and time', () => {
    render(
      <PublicTeeTimeGrid
        teeTimes={[makeTeeTime()]}
        courseName="Bay Pointe Golf Club"
        courseSlug="bay-pointe"
        selectedDate={BASE_DATE}
      />
    )
    expect(screen.getByText('$55.00')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /book now/i })).toBeInTheDocument()
  })

  it('shows an empty state when there are no tee times', () => {
    render(
      <PublicTeeTimeGrid
        teeTimes={[]}
        courseName="Bay Pointe Golf Club"
        courseSlug="bay-pointe"
        selectedDate={BASE_DATE}
      />
    )
    expect(screen.getByText(/no tee times available/i)).toBeInTheDocument()
  })

  it('Book Now links open in a new tab', () => {
    render(
      <PublicTeeTimeGrid
        teeTimes={[makeTeeTime({ id: 'tt-abc' })]}
        courseName="Bay Pointe Golf Club"
        courseSlug="bay-pointe"
        selectedDate={BASE_DATE}
      />
    )
    const link = screen.getByRole('link', { name: /book now/i })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('href', '/app/book/tt-abc')
  })

  it('filters to afternoon tee times when Afternoon filter selected', async () => {
    const user = userEvent.setup()
    const morning = makeTeeTime({ id: 'morning', scheduled_at: `${BASE_DATE}T10:00:00+00:00`, base_price: 45 })
    const afternoon = makeTeeTime({ id: 'afternoon', scheduled_at: `${BASE_DATE}T18:00:00+00:00`, base_price: 55 })

    render(
      <PublicTeeTimeGrid
        teeTimes={[morning, afternoon]}
        courseName="Bay Pointe Golf Club"
        courseSlug="bay-pointe"
        selectedDate={BASE_DATE}
      />
    )

    await user.click(screen.getByRole('button', { name: /afternoon/i }))
    expect(screen.queryByText('$45.00')).not.toBeInTheDocument()
    expect(screen.getByText('$55.00')).toBeInTheDocument()
  })

  it('filters by player count', async () => {
    const user = userEvent.setup()
    const solo = makeTeeTime({ id: 'solo', available_players: 1, base_price: 40 })
    const group = makeTeeTime({ id: 'group', available_players: 4, base_price: 55 })

    render(
      <PublicTeeTimeGrid
        teeTimes={[solo, group]}
        courseName="Bay Pointe Golf Club"
        courseSlug="bay-pointe"
        selectedDate={BASE_DATE}
      />
    )

    // Pick "4 golfers" — solo slot should be hidden
    await user.click(screen.getByRole('button', { name: '4' }))
    // Both $40 and $55 slots were rendered, but now solo is filtered
    const links = screen.getAllByRole('link', { name: /book now/i })
    expect(links).toHaveLength(1)
  })
})
