import { createAdminClient } from '@/lib/supabase/admin'
import { computeAnalytics, getRecentSignups, buildMrrHistory } from '@/lib/analytics'
import AnalyticsStatCards from '@/components/admin/AnalyticsStatCards'
import AnalyticsCharts from '@/components/admin/AnalyticsCharts'
import AnalyticsTimeFilter from '@/components/admin/AnalyticsTimeFilter'
import LaunchModeBanner from '@/components/admin/LaunchModeBanner'
import { isLiveMode } from '@/lib/site-config'
import { Suspense } from 'react'

export const metadata = { title: 'Admin Dashboard' }

function buildDailyBuckets(
  rows: { created_at: string }[],
  days: number
): { date: string; count: number }[] {
  const buckets: Record<string, number> = {}
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    buckets[key] = 0
  }
  for (const row of rows) {
    const key = new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (key in buckets) buckets[key]++
  }
  return Object.entries(buckets).map(([date, count]) => ({ date, count }))
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const { period = '30d' } = await searchParams
  const days = period === '7d' ? 7 : period === '90d' ? 90 : period === '1yr' ? 365 : 30

  const admin = createAdminClient()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  const [analytics, recentSignups, liveMode, membershipsAll, recentBookings, recentProfiles] = await Promise.all([
    computeAnalytics(period),
    getRecentSignups(10),
    isLiveMode(),
    admin.from('memberships').select('tier, status, created_at'),
    admin.from('bookings').select('created_at').neq('status', 'canceled').gte('created_at', cutoff.toISOString()),
    admin.from('profiles').select('created_at').gte('created_at', cutoff.toISOString()),
  ])

  const mrrHistory = buildMrrHistory(membershipsAll.data ?? [])
  const newMembersDaily = buildDailyBuckets(recentProfiles.data ?? [], days > 90 ? 52 : 30)
  const bookingVolumeDaily = buildDailyBuckets(recentBookings.data ?? [], days > 90 ? 52 : 30)

  const tierColor: Record<string, string> = {
    ace: 'bg-[#1B4332] text-[#FAF7F2]',
    eagle: 'bg-[#E0A800] text-[#1A1A1A]',
    fairway: 'bg-[#FAF7F2] text-[#1A1A1A] ring-1 ring-black/10',
  }

  return (
    <div className="space-y-8">
      <LaunchModeBanner isLive={liveMode} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Dashboard</h1>
          <p className="text-[#6B7770] text-sm mt-1">TeeAhead at a glance</p>
        </div>
        <Suspense>
          <AnalyticsTimeFilter />
        </Suspense>
      </div>

      <AnalyticsStatCards
        mrr={analytics.mrr}
        totalMembers={analytics.totalMembers}
        churnRate={analytics.churnRate}
        avgRevenuePerMember={analytics.avgRevenuePerMember}
      />

      <AnalyticsCharts
        mrrHistory={mrrHistory}
        tierBreakdown={analytics.tierBreakdown}
        newMembersDaily={newMembersDaily}
        bookingVolumeDaily={bookingVolumeDaily}
      />

      {/* Recent Signups */}
      <div className="bg-white rounded-xl ring-1 ring-black/5 p-6">
        <h2 className="font-bold text-[#1A1A1A] mb-4">Recent Signups</h2>
        {recentSignups.length === 0 ? (
          <p className="text-sm text-[#6B7770]">No signups yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-[#6B7770] border-b border-black/5">
              <tr>
                <th className="text-left pb-2 font-medium">Name</th>
                <th className="text-left pb-2 font-medium">Email</th>
                <th className="text-left pb-2 font-medium">Tier</th>
                <th className="text-left pb-2 font-medium">Joined</th>
                <th className="text-left pb-2 font-medium">Founding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {recentSignups.map(s => (
                <tr key={s.id}>
                  <td className="py-2.5 font-medium text-[#1A1A1A]">{s.full_name || '—'}</td>
                  <td className="py-2.5 text-[#6B7770]">{s.email}</td>
                  <td className="py-2.5">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${tierColor[s.tier] ?? tierColor.fairway}`}>
                      {s.tier}
                    </span>
                  </td>
                  <td className="py-2.5 text-[#6B7770]">
                    {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="py-2.5 text-[#6B7770] text-xs">
                    {s.founding_member ? '★' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
