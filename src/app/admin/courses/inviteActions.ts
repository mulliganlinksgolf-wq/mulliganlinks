'use server'

import { randomBytes } from 'crypto'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { buildCoursePartnerInviteEmail } from '@/lib/email/coursePartnerInvite'
import { revalidatePath } from 'next/cache'

const resend = new Resend(process.env.RESEND_API_KEY)

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('is_admin, full_name').eq('id', user.id).single()
  if (!profile?.is_admin) throw new Error('Forbidden')
  return profile.full_name ?? 'TeeAhead Admin'
}

export async function inviteCoursePartner(
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  let adminName: string
  try { adminName = await assertAdmin() } catch { return { error: 'Unauthorized' } }

  const courseId = formData.get('course_id') as string
  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const role = (formData.get('role') as string) || 'owner'

  if (!courseId || !name || !email) return { error: 'Name, email, and course are required' }

  const admin = createAdminClient()
  const { data: course } = await admin.from('courses').select('id, name, slug').eq('id', courseId).single()
  if (!course) return { error: 'Course not found' }

  const setupToken = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()

  const { error: upsertError } = await admin
    .from('crm_course_users')
    .upsert(
      { course_id: courseId, name, email, role, setup_token: setupToken, setup_token_expires_at: expiresAt, user_id: null },
      { onConflict: 'email' },
    )

  if (upsertError) return { error: upsertError.message }

  const setupUrl = `${process.env.NEXT_PUBLIC_APP_URL}/course/${course.slug}/setup?token=${setupToken}`
  const { subject, html, text } = buildCoursePartnerInviteEmail({ recipientName: name, courseName: course.name, setupUrl, adminName })

  const { error: emailError } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: email,
    subject,
    html,
    text,
  })

  if (emailError) return { error: `Invite saved but email failed: ${emailError.message}` }

  revalidatePath('/admin/courses')
  return { success: true }
}
