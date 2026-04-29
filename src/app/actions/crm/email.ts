'use server'

import { getResend } from '@/lib/resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CrmRecordType } from '@/lib/crm/types'

const ADMIN_EMAILS = ['mulliganlinksgolf@gmail.com', 'nbarris11@gmail.com', 'beslock@yahoo.com']

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!ADMIN_EMAILS.includes(user.email ?? '') && !profile?.is_admin) throw new Error('Not authorized')
  return { admin, user }
}

interface SendEmailParams {
  recordType: CrmRecordType
  recordId: string
  to: string
  subject: string
  bodyHtml: string
  sentBy: string
}

export async function sendCrmEmail(
  params: SendEmailParams
): Promise<{ error?: string; success?: boolean }> {
  const resend = getResend()
  if (!resend) {
    return { error: 'Email sending not configured. Set RESEND_API_KEY.' }
  }

  try {
    const { admin } = await assertAdmin()

    const { error: sendError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'TeeAhead CRM <crm@teeahead.com>',
      to: params.to,
      subject: params.subject,
      html: params.bodyHtml,
    })

    if (sendError) return { error: (sendError as { message?: string }).message ?? 'Send failed' }

    await admin.from('crm_activity_log').insert({
      record_type: params.recordType,
      record_id: params.recordId,
      type: 'email',
      body: `To: ${params.to}\nSubject: ${params.subject}`,
      created_by: params.sentBy,
    })

    if (params.recordType !== 'member') {
      const table = params.recordType === 'course' ? 'crm_courses' : 'crm_outings'
      await admin.from(table).update({ last_activity_at: new Date().toISOString() }).eq('id', params.recordId)
    }

    const path =
      params.recordType === 'course' ? `/admin/crm/courses/${params.recordId}`
      : params.recordType === 'outing' ? `/admin/crm/outings/${params.recordId}`
      : `/admin/crm/members/${params.recordId}`
    revalidatePath(path)
    revalidatePath('/admin/crm')

    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function getEmailTemplatesByType(recordType: CrmRecordType) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('crm_email_templates')
    .select('*')
    .eq('record_type', recordType)
    .order('name', { ascending: true })
  return data ?? []
}
