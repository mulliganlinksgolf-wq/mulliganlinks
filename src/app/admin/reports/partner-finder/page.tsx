import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Partner Finder Activity' }

export default async function PartnerFinderReportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/app')

  const today = new Date().toISOString().slice(0, 10)

  const [
    { count: prefsCount },
    { count: availCount },
    { count: pendingCount },
    { count: acceptedCount },
    { count: declinedCount },
    { count: withdrawnCount },
  ] = await Promise.all([
    admin.from('partner_preferences').select('id', { count: 'exact', head: true }).eq('is_visible', true),
    admin.from('partner_availability').select('id', { count: 'exact', head: true }).eq('is_active', true).gte('available_date', today),
    admin.from('partner_connection_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('partner_connection_requests').select('id', { count: 'exact', head: true }).eq('status', 'accepted'),
    admin.from('partner_connection_requests').select('id', { count: 'exact', head: true }).eq('status', 'declined'),
    admin.from('partner_connection_requests').select('id', { count: 'exact', head: true }).eq('status', 'withdrawn'),
  ])

  const stats = [
    { label: 'Members with visible profiles', value: prefsCount ?? 0 },
    { label: 'Active availability windows', value: availCount ?? 0 },
    { label: 'Requests — Pending', value: pendingCount ?? 0 },
    { label: 'Requests — Accepted', value: acceptedCount ?? 0 },
    { label: 'Requests — Declined', value: declinedCount ?? 0 },
    { label: 'Requests — Withdrawn', value: withdrawnCount ?? 0 },
  ]

  return (
    <div>
      <div className="mb-6">
        <a href="/admin/reports" className="text-sm text-[#6B7770] hover:text-[#1B4332]">← Reports</a>
        <h1 className="text-2xl font-bold text-[#1A1A1A] mt-2">Partner Finder Activity</h1>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-3xl font-bold text-[#1B4332]">{s.value.toLocaleString()}</p>
            <p className="text-sm text-[#6B7770] mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
