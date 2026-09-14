import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { CourseWaitlistSection } from '@/app/waitlist/course/CourseWaitlistSection'
const { join, captcha } = vi.hoisted(() => ({ join: vi.fn(), captcha: vi.fn() }))
vi.mock('@/app/waitlist/course/actions', () => ({ joinCourseWaitlist: join }))
vi.mock('react-google-recaptcha-v3', () => ({ useGoogleReCaptcha: () => ({ executeRecaptcha: captcha }) }))
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams() }))
beforeEach(() => { vi.clearAllMocks(); captcha.mockResolvedValue('token'); join.mockResolvedValue({ success: true }) })
async function fill() {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Course name'), 'Test Golf Club')
  await user.type(screen.getByLabelText('Your name'), 'Alex')
  await user.type(screen.getByLabelText('Email address'), 'alex@example.com')
  await user.click(screen.getByRole('button', { name: 'Talk to us about your course' }))
}
describe('course introduction', () => {
  it('submits three details and explains that no booking was made', async () => {
    render(<CourseWaitlistSection />)
    expect(screen.getAllByRole('textbox')).toHaveLength(3)
    await fill()
    expect(await screen.findByRole('status')).toHaveTextContent('No reservation, contract, or payment')
    expect(join.mock.calls[0][0].get('course_name')).toBe('Test Golf Club')
    expect(join.mock.calls[0][0].get('recaptcha_token')).toBe('token')
  })
  it('preserves all details and allows retry when security fails', async () => {
    captcha.mockRejectedValueOnce(new Error('offline'))
    render(<CourseWaitlistSection />)
    await fill()
    expect(await screen.findByRole('alert')).toHaveTextContent('Please try again')
    expect(screen.getByLabelText('Course name')).toHaveValue('Test Golf Club')
    expect(screen.getByLabelText('Email address')).toHaveValue('alex@example.com')
    expect(join).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Talk to us about your course' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Thanks for the introduction')
  })
})
