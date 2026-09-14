import { beforeEach, describe, expect, it, vi } from 'vitest'
import { joinCourseWaitlist } from '@/app/waitlist/course/actions'
const { insert, confirm, alert, captcha } = vi.hoisted(() => ({ insert: vi.fn(), confirm: vi.fn(), alert: vi.fn(), captcha: vi.fn() }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from: () => ({ insert }) }) }))
vi.mock('@/lib/resend', () => ({ sendCourseWaitlistConfirmation: confirm, sendCourseAdminAlert: alert }))
vi.mock('@/lib/recaptcha', () => ({ verifyRecaptcha: captcha }))
beforeEach(() => { vi.clearAllMocks(); insert.mockResolvedValue({ error: null }); captcha.mockResolvedValue(true); confirm.mockResolvedValue(undefined); alert.mockResolvedValue(undefined) })
function form() { const f = new FormData(); for (const [k,v] of Object.entries({ course_name:'Test Golf', contact_name:'Alex', email:'ALEX@example.com', recaptcha_token:'token' })) f.set(k,v); return f }
describe('course interest action', () => {
 it('accepts minimal details without inventing software status', async () => {
   expect(await joinCourseWaitlist(form())).toEqual({ success: true })
   expect(insert).toHaveBeenCalledWith(expect.objectContaining({ email:'alex@example.com', on_golfnow:null, current_software:null, status:'pending' }))
 })
 it('keeps a saved request successful if email fails', async () => {
   confirm.mockRejectedValue(new Error('offline'))
   expect(await joinCourseWaitlist(form())).toEqual({ success: true })
 })
 it('handles duplicates without sending another email', async () => {
   insert.mockResolvedValue({ error:{code:'23505'} })
   expect(await joinCourseWaitlist(form())).toEqual({ success:true })
   expect(confirm).not.toHaveBeenCalled()
 })
 it('rejects invalid input and failed captcha', async () => {
   const f=form(); f.set('email','bad@'); expect(await joinCourseWaitlist(f)).toHaveProperty('error')
   captcha.mockResolvedValue(false); expect(await joinCourseWaitlist(form())).toHaveProperty('error')
   expect(insert).not.toHaveBeenCalled()
 })
})
