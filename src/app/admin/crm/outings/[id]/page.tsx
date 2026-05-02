import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { RecordHeader } from '@/components/crm/RecordHeader'
import { ActivityLog } from '@/components/crm/ActivityLog'
import { DocumentList } from '@/components/crm/DocumentList'
import { OutingDetailClient } from './OutingDetailClient'
import { getActivityLog } from '@/app/actions/crm/activity'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data } = await supabase.from('crm_outings').select('name').eq('id', id).single()
  return { title: data?.name ? `${data.name} | CRM Outings` : 'Outing Detail' }
}

export default async function OutingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const [{ data: outing }, activities] = await Promise.all([
    supabase.from('crm_outings').select('*').eq('id', id).single(),
    getActivityLog('outing', id),
  ])
  if (!outing) notFound()

  const statusColors: Record<string, 'green' | 'amber' | 'slate' | 'red' | 'blue'> = {
    confirmed: 'green', completed: 'green', quoted: 'blue',
    lead: 'slate', cancelled: 'red',
  }

  return (
    <div className="p-6 max-w-5xl">
      <RecordHeader
        backHref="/admin/crm/outings"
        backLabel="Outing Leads"
        title={outing.contact_name}
        subtitle={outing.event_date ? `Event: ${new Date(outing.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : undefined}
        badge={{ label: outing.status, color: statusColors[outing.status] ?? 'slate' }}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OutingDetailClient outing={outing} />
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4 text-sm uppercase tracking-wide">Activity Log</h3>
            <ActivityLog activities={activities} />
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4 text-sm uppercase tracking-wide">Documents</h3>
            <Suspense fallback={<p className="text-xs text-slate-400">Loading…</p>}>
              <DocumentList recordType="outing" recordId={id} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
