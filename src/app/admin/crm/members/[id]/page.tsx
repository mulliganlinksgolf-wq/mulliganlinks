import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { RecordHeader } from '@/components/crm/RecordHeader'
import { ActivityLog } from '@/components/crm/ActivityLog'
import { DocumentList } from '@/components/crm/DocumentList'
import { MemberDetailClient } from './MemberDetailClient'
import { getActivityLog } from '@/app/actions/crm/activity'

export const dynamic = 'force-dynamic'

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const [{ data: member }, activities] = await Promise.all([
    supabase.from('crm_members').select('*').eq('id', id).single(),
    getActivityLog('member', id),
  ])
  if (!member) notFound()

  const tierColors: Record<string, 'green' | 'amber' | 'slate' | 'red' | 'blue'> = {
    ace: 'amber', eagle: 'blue', free: 'slate',
  }

  return (
    <div className="p-6 max-w-5xl">
      <RecordHeader
        backHref="/admin/crm/members"
        backLabel="Members"
        title={member.name}
        subtitle={member.email ?? undefined}
        badge={{ label: member.membership_tier, color: tierColors[member.membership_tier] ?? 'slate' }}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MemberDetailClient member={member} />
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4 text-sm uppercase tracking-wide">Activity Log</h3>
            <ActivityLog activities={activities} />
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4 text-sm uppercase tracking-wide">Documents</h3>
            <Suspense fallback={<p className="text-sm text-slate-400">Loading…</p>}>
              <DocumentList recordType="member" recordId={id} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
