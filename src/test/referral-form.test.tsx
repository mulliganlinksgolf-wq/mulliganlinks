import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { GolferWaitlistForm } from '@/app/waitlist/golfer/GolferWaitlistForm'
vi.mock('@/app/waitlist/golfer/actions', () => ({ joinGolferWaitlist: vi.fn() }))
vi.mock('@/lib/waitlist-tracking', () => ({ trackWaitlist: vi.fn() }))
vi.mock('react-google-recaptcha-v3', () => ({ useGoogleReCaptcha: () => ({ executeRecaptcha: vi.fn() }) }))
describe('Golfer waitlist initial questions', () => {
  it('asks only for email and ZIP before joining', () => {
    render(<GolferWaitlistForm />)
    expect(screen.getAllByRole('textbox')).toHaveLength(2)
    expect(screen.queryByLabelText(/how did you hear about us/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/home course/i)).not.toBeInTheDocument()
  })
})
