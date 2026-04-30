import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { GolferWaitlistForm } from '@/app/waitlist/golfer/GolferWaitlistForm'

vi.mock('@/app/waitlist/golfer/actions', () => ({
  joinGolferWaitlist: vi.fn(),
}))

describe('GolferWaitlistForm', () => {
  it('shows last name field without needing to open an accordion', () => {
    render(<GolferWaitlistForm />)
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
  })

  it('does not render an accordion toggle button', () => {
    render(<GolferWaitlistForm />)
    expect(
      screen.queryByRole('button', { name: /optional.*personalize/i })
    ).not.toBeInTheDocument()
  })

  it('shows optional fields without any user interaction', () => {
    render(<GolferWaitlistForm />)
    expect(screen.getByLabelText(/home course/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/rounds per year/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/current membership/i)).toBeInTheDocument()
  })

  it('last name field is not marked required', () => {
    render(<GolferWaitlistForm />)
    const lastNameInput = screen.getByLabelText(/last name/i)
    expect(lastNameInput).not.toHaveAttribute('required')
  })
})
