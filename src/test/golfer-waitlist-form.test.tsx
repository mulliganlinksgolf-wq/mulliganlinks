import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { GolferWaitlistForm } from '@/app/waitlist/golfer/GolferWaitlistForm'
import { TierPicker } from '@/app/waitlist/golfer/TierPicker'
import { joinGolferWaitlist } from '@/app/waitlist/golfer/actions'
import { trackWaitlist } from '@/lib/waitlist-tracking'

const { captcha } = vi.hoisted(() => ({ captcha: vi.fn() }))
vi.mock('react-google-recaptcha-v3', () => ({ useGoogleReCaptcha: () => ({ executeRecaptcha: captcha }) }))
vi.mock('@/app/waitlist/golfer/actions', () => ({ joinGolferWaitlist: vi.fn() }))
vi.mock('@/lib/waitlist-tracking', () => ({ trackWaitlist: vi.fn() }))

beforeEach(() => { vi.clearAllMocks(); captcha.mockResolvedValue('token') })
async function fillAndSubmit() {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Email address'), 'golfer@example.com')
  await user.type(screen.getByLabelText('ZIP code'), '48009')
  await user.click(screen.getByRole('button', { name: 'Notify me at launch' }))
}

describe('Golfer waitlist', () => {
  it('submits only email and ZIP with the current tier and tracks a saved signup', async () => {
    vi.mocked(joinGolferWaitlist).mockResolvedValue({ success: true, alreadyJoined: false })
    render(<GolferWaitlistForm tier="eagle" />)
    expect(screen.queryByLabelText(/last name/i)).not.toBeInTheDocument()
    await fillAndSubmit()
    expect(await screen.findByRole('status')).toHaveTextContent('You’re on the list')
    const data = vi.mocked(joinGolferWaitlist).mock.calls[0][0]
    expect(data.get('email')).toBe('golfer@example.com')
    expect(data.get('interested_tier')).toBe('eagle')
    expect(data.get('recaptcha_token')).toBe('token')
    expect(trackWaitlist).toHaveBeenCalledWith('golfer_waitlist_succeeded')
    expect(vi.mocked(trackWaitlist).mock.calls.filter(([event]) => event === 'golfer_waitlist_started')).toHaveLength(1)
  })
  it('preserves inputs and permits retry after a security exception', async () => {
    captcha.mockRejectedValueOnce(new Error('offline'))
    render(<GolferWaitlistForm />)
    await fillAndSubmit()
    expect(await screen.findByRole('alert')).toHaveTextContent('Please try again')
    expect(screen.getByLabelText('Email address')).toHaveValue('golfer@example.com')
    expect(joinGolferWaitlist).not.toHaveBeenCalled()
    expect(trackWaitlist).toHaveBeenCalledWith('golfer_waitlist_failed', 'security_check')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Notify me at launch' })).toBeEnabled())
  })
  it('does not count an existing signup as a new conversion', async () => {
    vi.mocked(joinGolferWaitlist).mockResolvedValue({ success: true, alreadyJoined: true })
    render(<GolferWaitlistForm />)
    await fillAndSubmit()
    await screen.findByRole('status')
    expect(trackWaitlist).toHaveBeenCalledWith('golfer_waitlist_already_joined')
    expect(trackWaitlist).not.toHaveBeenCalledWith('golfer_waitlist_succeeded')
  })
  it('moves from a tier card to the earlier form and submits that preference', async () => {
    const scroll = vi.fn()
    Element.prototype.scrollIntoView = scroll
    vi.mocked(joinGolferWaitlist).mockResolvedValue({ success: true, alreadyJoined: false })
    render(<TierPicker tiers={[{ key: 'eagle', name: 'Eagle', price: '$89', period: '/yr', badge: null, features: [] }]} initialTier="fairway" />)
    const input = screen.getByLabelText('Email address')
    const button = screen.getByRole('button', { name: /Continue with Eagle/ })
    expect(input.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    await userEvent.click(button)
    expect(input).toHaveFocus()
    expect(scroll).toHaveBeenCalled()
    await fillAndSubmit()
    await screen.findByRole('status')
    expect(vi.mocked(joinGolferWaitlist).mock.calls[0][0].get('interested_tier')).toBe('eagle')
  })
})
