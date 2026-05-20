'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const ADMIN_EMAILS = ['mulliganlinksgolf@gmail.com', 'neil@teeahead.com', 'beslock@yahoo.com']

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  if (!ADMIN_EMAILS.includes(user.email ?? '') && !profile?.is_admin) throw new Error('Not authorized')
  return { admin, user }
}

/**
 * Approve a draft template:
 *   1. Archive the current active row with the same name
 *   2. Set the draft to active
 *   3. Write an audit log entry
 */
export async function approveTemplateDraft(
  draftId: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    const { admin, user } = await assertAdmin()

    // Fetch the draft to get its name
    const { data: draft, error: fetchErr } = await admin
      .from('crm_email_templates')
      .select('id, name, subject, record_type, status, version')
      .eq('id', draftId)
      .single()

    if (fetchErr || !draft) return { error: 'Draft not found' }
    if (draft.status !== 'draft') return { error: 'Row is not a draft' }

    // Archive the current active row (may not exist if this is a brand-new name)
    const { data: activeRows } = await admin
      .from('crm_email_templates')
      .select('id')
      .eq('name', draft.name)
      .eq('status', 'active')

    if (activeRows && activeRows.length > 0) {
      await admin
        .from('crm_email_templates')
        .update({ status: 'archived', superseded_by: draftId })
        .in('id', activeRows.map((r) => r.id))
    }

    // Activate the draft
    const { error: activateErr } = await admin
      .from('crm_email_templates')
      .update({ status: 'active' })
      .eq('id', draftId)

    if (activateErr) return { error: activateErr.message }

    // Audit log
    await admin.from('admin_audit_log').insert({
      admin_id: user.id,
      admin_email: user.email,
      event_type: 'template_approved',
      target_type: 'crm_email_template',
      target_id: draftId,
      target_label: draft.name,
      details: { subject: draft.subject, version: draft.version },
    })

    revalidatePath('/admin/crm/email-templates')
    revalidatePath('/admin/crm/email-templates/review')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

/**
 * Reject a draft template:
 *   1. Archive the draft
 *   2. Write an audit log entry
 */
export async function rejectTemplateDraft(
  draftId: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    const { admin, user } = await assertAdmin()

    const { data: draft, error: fetchErr } = await admin
      .from('crm_email_templates')
      .select('id, name, subject, version, status')
      .eq('id', draftId)
      .single()

    if (fetchErr || !draft) return { error: 'Draft not found' }
    if (draft.status !== 'draft') return { error: 'Row is not a draft' }

    await admin
      .from('crm_email_templates')
      .update({ status: 'archived' })
      .eq('id', draftId)

    await admin.from('admin_audit_log').insert({
      admin_id: user.id,
      admin_email: user.email,
      event_type: 'template_rejected',
      target_type: 'crm_email_template',
      target_id: draftId,
      target_label: draft.name,
      details: { subject: draft.subject, version: draft.version },
    })

    revalidatePath('/admin/crm/email-templates')
    revalidatePath('/admin/crm/email-templates/review')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
