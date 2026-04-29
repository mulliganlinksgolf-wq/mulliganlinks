import { createAdminClient } from '@/lib/supabase/admin'
import DisputeList from '@/components/admin/DisputeList'
import { type DisputeRow } from '@/components/admin/DisputeDetailPanel'

export const metadata = { title: 'Disputes' }

export default async function DisputesPage() {
  const admin = createAdminClient()

  const [disputesResult, auditResult] = await Promise.all([
    admin.from('payment_disputes')
      .select('id, stripe_dispute_id, amount_cents, reason, status, evidence_due_by, created_at, resolved_at, booking_id')
      .order('created_at', { ascending: false }),
    admin.from('admin_audit_log')
      .select('target_id, event_type, created_at, details')
      .eq('target_type', 'dispute')
      .order('created_at', { ascending: false }),
  ])

  const disputes = disputesResult.data ?? []
  const auditRows = auditResult.data ?? []

  const bookingIds = disputes.map((d: any) => d.booking_id).filter(Boolean)
  let memberMap: Record<string, { name: string | null; email: string | null }> = {}

  if (bookingIds.length > 0) {
    const { data: bookings } = await admin
      .from('bookings')
      .select('id, user_id, profiles(full_name, email)')
      .in('id', bookingIds)

    for (const b of bookings ?? []) {
      memberMap[b.id] = {
        name: (b as any).profiles?.full_name ?? null,
        email: (b as any).profiles?.email ?? null,
      }
    }
  }

  const rows: DisputeRow[] = disputes.map((d: any) => ({
    id: d.id,
    stripe_dispute_id: d.stripe_dispute_id ?? '',
    amount_cents: d.amount_cents ?? 0,
    reason: d.reason,
    status: d.status ?? 'open',
    evidence_due_by: d.evidence_due_by,
    created_at: d.created_at,
    resolved_at: d.resolved_at,
    member_name: d.booking_id ? (memberMap[d.booking_id]?.name ?? null) : null,
    member_email: d.booking_id ? (memberMap[d.booking_id]?.email ?? null) : null,
    timeline: auditRows
      .filter((a: any) => a.target_id === (d.stripe_dispute_id ?? d.id))
      .map((a: any) => ({ event_type: a.event_type, created_at: a.created_at, details: a.details })),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Disputes</h1>
        <p className="text-[#6B7770] text-sm mt-1">{rows.length} total dispute{rows.length !== 1 ? 's' : ''}</p>
      </div>
      <DisputeList disputes={rows} />
    </div>
  )
}
