export const metadata = { title: 'CRM Dashboard' }

import { getCrmDashboardStats, getRecentActivity, getStaleLeads } from '@/lib/crm/queries'
import { KPITiles } from '@/components/crm/KPITiles'
import { ActivityFeed } from '@/components/crm/ActivityFeed'
import { StaleLeadAlert } from '@/components/crm/StaleLeadAlert'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function CrmDashboardPage() {
  const staleDays = parseInt(process.env.STALE_LEAD_DAYS ?? '7', 10)

  const [stats, recentActivity, staleLeads] = await Promise.all([
    getCrmDashboardStats(),
    getRecentActivity(20),
    getStaleLeads(staleDays),
  ])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">CRM</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/crm/courses/new"
            className="px-3 py-1.5 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800 transition-colors"
          >
            + Course
          </Link>
          <Link
            href="/admin/crm/outings/new"
            className="px-3 py-1.5 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800 transition-colors"
          >
            + Outing
          </Link>
          <Link
            href="/admin/crm/members/new"
            className="px-3 py-1.5 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800 transition-colors"
          >
            + Member
          </Link>
        </div>
      </div>

      <KPITiles stats={stats} />

      <StaleLeadAlert
        staleCourses={staleLeads.staleCourses}
        staleOutings={staleLeads.staleOutings}
        staleDays={staleDays}
      />

      <ActivityFeed activities={recentActivity} />
    </div>
  )
}
