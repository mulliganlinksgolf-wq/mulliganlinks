'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit'
import { revalidatePath } from 'next/cache'

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

export async function markDisputeWon(
  disputeId: string,
  stripeDisputeId: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    const { admin, user } = await assertAdmin()
    const { error } = await admin.from('payment_disputes')
      .update({ status: 'won', outcome: 'won', resolved_at: new Date().toISOString() })
      .eq('id', disputeId)
    if (error) return { error: error.message }

    await writeAuditLog({
      eventType: 'dispute_updated',
      targetType: 'dispute',
      targetId: stripeDisputeId,
      targetLabel: `Dispute ${stripeDisputeId}`,
      details: { action: 'marked_won', by: user.email },
    })
    revalidatePath('/admin/disputes')
    return { success: true }
  } catch (e: any) {
    return { error: e.message ?? 'Something went wrong.' }
  }
}

export async function markDisputeLost(
  disputeId: string,
  stripeDisputeId: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    const { admin, user } = await assertAdmin()
    const { error } = await admin.from('payment_disputes')
      .update({ status: 'lost', outcome: 'lost', resolved_at: new Date().toISOString() })
      .eq('id', disputeId)
    if (error) return { error: error.message }

    await writeAuditLog({
      eventType: 'dispute_updated',
      targetType: 'dispute',
      targetId: stripeDisputeId,
      targetLabel: `Dispute ${stripeDisputeId}`,
      details: { action: 'marked_lost', by: user.email },
    })
    revalidatePath('/admin/disputes')
    return { success: true }
  } catch (e: any) {
    return { error: e.message ?? 'Something went wrong.' }
  }
}

export async function addDisputeNote(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    const { user } = await assertAdmin()
    const disputeId = formData.get('disputeId') as string
    const stripeDisputeId = formData.get('stripeDisputeId') as string
    const note = (formData.get('note') as string).trim()
    if (!note) return { error: 'Note cannot be empty.' }

    await writeAuditLog({
      eventType: 'dispute_updated',
      targetType: 'dispute',
      targetId: stripeDisputeId,
      targetLabel: `Dispute ${stripeDisputeId}`,
      details: { action: 'note_added', note, by: user.email, dispute_row_id: disputeId },
    })
    revalidatePath('/admin/disputes')
    return { success: true }
  } catch (e: any) {
    return { error: e.message ?? 'Something went wrong.' }
  }
}
