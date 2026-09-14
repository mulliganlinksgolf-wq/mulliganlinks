import { beforeEach, describe, expect, it, vi } from 'vitest'
import { joinGolferWaitlist } from '@/app/waitlist/golfer/actions'
const { insert, select, email, captcha } = vi.hoisted(() => ({ insert: vi.fn(), select: vi.fn(), email: vi.fn(), captcha: vi.fn() }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from: () => ({ insert, select }) }) }))
vi.mock('@/lib/resend', () => ({ sendGolferWaitlistConfirmation: email }))
vi.mock('@/lib/recaptcha', () => ({ verifyRecaptcha: captcha }))
beforeEach(() => { vi.clearAllMocks(); insert.mockResolvedValue({ error: null }); select.mockResolvedValue({ count: 2 }); captcha.mockResolvedValue(true); email.mockResolvedValue(undefined) })
function form() { const f = new FormData(); f.set('email', 'GOLFER@example.com'); f.set('zip_code', '48009'); f.set('recaptcha_token', 'token'); return f }
describe('short golfer signup action', () => {
  it('saves missing names as null and normalizes email', async () => {
    expect(await joinGolferWaitlist(form())).toMatchObject({ success: true })
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ email: 'golfer@example.com', first_name: null, last_name: null, zip_code: '48009' }))
    expect(email).toHaveBeenCalledWith(expect.objectContaining({ firstName: 'there' }))
  })
  it('rejects invalid ZIP before writing', async () => {
    const data = form(); data.set('zip_code', 'abc')
    expect(await joinGolferWaitlist(data)).toMatchObject({ reason: 'validation' })
    expect(insert).not.toHaveBeenCalled()
  })
  it('does not write when CAPTCHA fails', async () => {
    captcha.mockResolvedValue(false)
    expect(await joinGolferWaitlist(form())).toMatchObject({ reason: 'security_check' })
    expect(insert).not.toHaveBeenCalled()
  })
  it('keeps a saved signup successful if email delivery throws', async () => {
    email.mockRejectedValue(new Error('email unavailable'))
    expect(await joinGolferWaitlist(form())).toMatchObject({ success: true, alreadyJoined: false })
  })
  it('handles duplicate emails without another confirmation or conversion', async () => {
    insert.mockResolvedValue({ error: { code: '23505' } })
    expect(await joinGolferWaitlist(form())).toEqual({ success: true, alreadyJoined: true })
    expect(email).not.toHaveBeenCalled()
  })
  it('reports a database failure without claiming success', async () => {
    insert.mockResolvedValue({ error: { code: 'other' } })
    expect(await joinGolferWaitlist(form())).toMatchObject({ reason: 'save' })
    expect(email).not.toHaveBeenCalled()
  })
})
