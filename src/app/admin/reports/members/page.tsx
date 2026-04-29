import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getMemberKpis, getMemberGrowth, getAtRiskMembers } from '@/lib/reports/members'
import KpiTile from '@/components/reports/KpiTile'
import DateRangePicker from '@/components/reports/DateRangePicker'
import CsvExportButton from '@/components/reports/CsvExportButton'
import { GrowthLineChart, ChurnLineChart, TierDonut } from './MemberCharts'

export const metadata = { title: 'Member Reports' }

export default async function MemberReportPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/app')

  const [kpis, growth, atRisk] = await Promise.all([
    getMemberKpis(),
    getMemberGrowth(12),
    getAtRiskMembers(),
  ])

  const churnData = growth.map(g => ({
    month: g.month,
    churnPct: g.totalActive > 0 ? Math.round((g.churned / g.totalActive) * 100 * 10) / 10 : 0,
  }))

  const atRiskCsvData = atRisk.map(m => ({
    Name: m.name ?? '',
    Email: m.email ?? '',
    Tier: m.tier,
    Joined: m.joinedAt.slice(0, 10),
    'Days Since Activity': m.daysSinceActivity,
  }))

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Member Reports</h1>
        <DateRangePicker />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiTile label="Total Paying Members" value={kpis.totalPaying.toString()} accent />
        <KpiTile label="MRR" value={`$${kpis.mrr.toLocaleString()}`} />
        <KpiTile label="Churn Rate" value={`${kpis.churnRatePct}%`} sub="all time (all tiers)" />
        <KpiTile label="At-Risk Members" value={kpis.atRiskCount.toString()} alert={kpis.atRiskCount > 0} sub="Eagle, no activity 45+ days" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="sm:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-[#1A1A1A] mb-4">Member Growth (12 months)</h2>
          <GrowthLineChart data={growth} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-[#1A1A1A] mb-4">Tier Mix</h2>
          <TierDonut eagle={kpis.eagleCount} ace={kpis.aceCount} free={kpis.freeCount} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-[#1A1A1A] mb-4">Churn Rate (12 months)</h2>
        <ChurnLineChart data={churnData} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 id="at-risk-heading" className="font-semibold text-[#1A1A1A]">At-Risk Eagle Members</h2>
          <CsvExportButton data={atRiskCsvData} filename="at-risk-members.csv" label="Export for Win-Back" />
        </div>
        {atRisk.length === 0 ? (
          <p className="text-sm text-[#6B7770]">No at-risk members. Great retention!</p>
        ) : (
          <table className="w-full text-sm" aria-labelledby="at-risk-heading">
            <thead>
              <tr className="border-b border-gray-100">
                {['Name', 'Email', 'Joined', 'Days Inactive'].map(h => (
                  <th key={h} scope="col" className="text-left py-2 px-3 text-xs text-[#6B7770] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {atRisk.map(m => (
                <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3">{m.name ?? '—'}</td>
                  <td className="py-2 px-3 text-[#6B7770]">{m.email ?? '—'}</td>
                  <td className="py-2 px-3 text-[#6B7770]">{m.joinedAt.slice(0, 10)}</td>
                  <td className="py-2 px-3 font-medium text-amber-700">{m.daysSinceActivity}d</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
