'use server'
import { requireManager } from '@/lib/courseRole'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import {
  marketingEnabled,
  marketingOrigin,
} from '@/lib/course-marketing/server'
import { getResend } from '@/lib/resend'
import { UUID, validateCampaign } from '@/lib/course-marketing/content'

export async function queueCampaign(
  slug: string,
  _state: { error?: string; success?: string },
  form: FormData,
): Promise<{ error?: string; success?: string }> {
  const ctx = await requireManager(slug)
  if (!marketingEnabled() || !getResend())
    return { error: 'Course email sending is not enabled yet.' }
  marketingOrigin()
  const id = String(form.get('campaignId') ?? '')
  const subject = String(form.get('subject') ?? '').trim()
  const body = String(form.get('body') ?? '').trim()
  const audience = String(form.get('audience') ?? '')
  const validation = validateCampaign(subject, body, audience)
  if (validation) return { error: validation }
  if (!UUID.test(id) || form.get('reviewed') !== 'yes')
    return { error: 'Review your message and audience before sending.' }
  const { error } = await createAdminClient().rpc('queue_course_email', {
    p_id: id,
    p_course: ctx.courseId,
    p_actor: ctx.userId,
    p_subject: subject,
    p_body: body,
    p_audience: audience,
  })
  if (error) {
    console.error('[queue-course-email]', error)
    const known = [
      'Add the course mailing address before sending.',
      'You can send up to five campaigns per day.',
      'No subscribed golfers in this audience yet.',
    ]
    return {
      error:
        known.find((message) => error.message.includes(message)) ??
        'Could not queue this campaign. Please try again.',
    }
  }
  revalidatePath(`/course/${slug}/marketing`)
  return {
    success:
      'Campaign queued. Emails will send in batches automatically. Refresh to check progress.',
  }
}

export async function cancelCampaign(slug: string, form: FormData) {
  const ctx = await requireManager(slug)
  const id = String(form.get('id') ?? '')
  if (!UUID.test(id)) throw new Error('Invalid campaign.')
  const { error } = await createAdminClient()
    .from('course_email_campaigns')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('course_id', ctx.courseId)
    .eq('status', 'queued')
  if (error) throw new Error('Could not stop this campaign.')
  revalidatePath(`/course/${slug}/marketing`)
}
