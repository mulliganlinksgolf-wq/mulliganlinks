import { createAdminClient } from '@/lib/supabase/admin'
import { OutingsTableWrapper } from './OutingsTableWrapper'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getOutings() {
  const supabase = createAdminClient()
  const { data } = await supabase.from('crm_outings').select('*').order('event_date', { ascending: true, nullsFirst: false })
  return data ?? []
}

export default async function OutingsPage() {
  const outings = await getOutings()
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Outing Leads</h1>
        <Link href="/admin/crm/outings/new" className="px-3 py-1.5 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800">
          + New Outing
        </Link>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <OutingsTableWrapper outings={outings} />
      </div>
    </div>
  )
}
