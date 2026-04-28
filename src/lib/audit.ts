import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type AuditEventType =
  | 'membership_cancelled'
  | 'refund_issued'
  | 'tier_changed'
  | 'member_created'
  | 'member_deleted'
  | 'credit_added'
  | 'points_adjusted'
  | 'config_changed'
  | 'content_edited'
  | 'dispute_updated'
  | 'email_sent'
  | 'admin_note_added'
  | 'profile_updated'

export type AuditTargetType = 'member' | 'config' | 'content' | 'dispute' | 'communication'

interface WriteAuditLogParams {
  eventType: AuditEventType
  targetType: AuditTargetType
  targetId?: string
  targetLabel?: string
  details?: Record<string, unknown>
}

export async function writeAuditLog(params: WriteAuditLogParams): Promise<void> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const admin = createAdminClient()
    await admin.from('admin_audit_log').insert({
      admin_id: user.id,
      admin_email: user.email ?? '',
      event_type: params.eventType,
      target_type: params.targetType,
      target_id: params.targetId,
      target_label: params.targetLabel,
      details: params.details ?? {},
    })
  } catch {
    // Non-blocking: audit log failure never surfaces to the caller
  }
}
