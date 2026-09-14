import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createCoursePreferenceToken, readCoursePreferenceToken } from '@/lib/waitlist-preference-token'
import { CoursePreferenceForm } from '@/app/waitlist/golfer/CoursePreferenceForm'
import { saveCoursePreference } from '@/app/waitlist/golfer/actions'
const { update, eq, single } = vi.hoisted(() => ({ update: vi.fn(), eq: vi.fn(), single: vi.fn() }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from: () => ({ update }) }) }))
vi.mock('@/lib/resend', () => ({ sendGolferWaitlistConfirmation: vi.fn() }))
vi.mock('@/lib/recaptcha', () => ({ verifyRecaptcha: vi.fn() }))
beforeEach(() => {
 vi.clearAllMocks(); vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-only-key')
 update.mockReturnValue({ eq }); eq.mockReturnValue({ select: () => ({ maybeSingle: single }) }); single.mockResolvedValue({ data: { id: 1 }, error: null })
})
describe('optional course preference security', () => {
 it('saves only to the signup identified by the signed token', async () => {
   const token = createCoursePreferenceToken('golfer@example.com')
   expect(await saveCoursePreference(token, '  Local Golf, Detroit  ')).toEqual({ success: true })
   expect(update).toHaveBeenCalledWith({ home_course: 'Local Golf, Detroit' })
   expect(eq).toHaveBeenCalledWith('email', 'golfer@example.com')
 })
 it('rejects changed identity, invalid tokens, and expired sessions before database access', async () => {
   const token = createCoursePreferenceToken('golfer@example.com')
   const [payload, signature] = token.split('.')
   const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
   data.email = 'someone-else@example.com'
   const forged = Buffer.from(JSON.stringify(data)).toString('base64url') + '.' + signature
   expect(await saveCoursePreference(forged, 'Local Golf')).toHaveProperty('error')
   expect(readCoursePreferenceToken('bad')).toBeNull()
   const clock = vi.spyOn(Date, 'now').mockReturnValue(data.expires + 1)
   expect(await saveCoursePreference(token, 'Local Golf')).toHaveProperty('error')
   clock.mockRestore()
   expect(update).not.toHaveBeenCalled()
 })
 it('allows skipping without writing', async () => {
   render(<CoursePreferenceForm token={createCoursePreferenceToken('golfer@example.com')} />)
   await userEvent.click(screen.getByRole('button', { name: 'Skip for now' }))
   expect(screen.getByText(/You’re all set/)).toBeInTheDocument()
   expect(update).not.toHaveBeenCalled()
 })
 it('saves the optional answer and shows confirmation', async () => {
   render(<CoursePreferenceForm token={createCoursePreferenceToken('golfer@example.com')} />)
   await userEvent.type(screen.getByLabelText(/Where do you usually play/), 'Local Golf')
   await userEvent.click(screen.getByRole('button', { name: 'Save my course' }))
   expect(await screen.findByRole('status')).toHaveTextContent('Your signup is complete')
 })
})
