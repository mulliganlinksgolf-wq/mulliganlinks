import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { CourseWaitlistSection } from '@/app/waitlist/course/CourseWaitlistSection'

vi.mock('@/app/waitlist/course/CourseWaitlistForm', () => ({
  CourseWaitlistForm: ({ prefillExpiryDate }: { prefillExpiryDate?: string }) => (
    <div data-testid="course-form">
      <input
        data-testid="expiry-input"
        name="contract_expiry_date"
        type="date"
        defaultValue={prefillExpiryDate ?? ''}
        readOnly
      />
    </div>
  ),
}))

vi.mock('@/app/waitlist/course/GolfNowCountdown', () => ({
  GolfNowCountdown: ({
    expiryDate,
    onExpiryChange,
  }: {
    expiryDate: string
    onExpiryChange: (v: string) => void
  }) => (
    <input
      data-testid="countdown-input"
      type="date"
      value={expiryDate}
      onChange={(e) => onExpiryChange(e.target.value)}
    />
  ),
}))

describe('CourseWaitlistSection', () => {
  it('passes expiry date entered in countdown down to the form', () => {
    render(<CourseWaitlistSection spotsRemaining={5} />)
    const countdownInput = screen.getByTestId('countdown-input')
    fireEvent.change(countdownInput, { target: { value: '2026-12-31' } })
    const expiryInput = screen.getByTestId('expiry-input')
    expect(expiryInput).toHaveValue('2026-12-31')
  })

  it('starts with empty expiry date', () => {
    render(<CourseWaitlistSection spotsRemaining={5} />)
    expect(screen.getByTestId('countdown-input')).toHaveValue('')
  })
})
