import { createAdminClient } from '@/lib/supabase/admin'
import { MemberTable } from '@/components/crm/MemberTable'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function CrmMembersPage() {
  const supabase = createAdminClient()
  const { data: members } = await supabase
    .from('crm_members')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Members</h1>
        <Link href="/admin/crm/members/new" className="px-3 py-1.5 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800">
          + New Member
        </Link>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <MemberTable initialMembers={members ?? []} onExportCsv={() => {}} />
      </div>
    </div>
  )
}
