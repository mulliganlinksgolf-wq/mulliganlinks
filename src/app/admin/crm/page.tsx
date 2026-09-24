import Link from 'next/link'
import { getCrmDashboardStats, getRecentActivity, getStaleLeads } from '@/lib/crm/queries'
import { getWorkspaceData } from '@/lib/crm/workspace-queries'
import { detroitDate } from '@/lib/crm/workspace'
import { createClient } from '@/lib/supabase/server'
import { OutreachWorkspace } from '@/components/crm/OutreachWorkspace'
import { KPITiles } from '@/components/crm/KPITiles'
import { ActivityFeed } from '@/components/crm/ActivityFeed'
import { StaleLeadAlert } from '@/components/crm/StaleLeadAlert'

export const metadata = { title: 'CRM Outreach Workspace' }
export const dynamic = 'force-dynamic'

export default async function CrmDashboardPage() {
  const staleDays = parseInt(process.env.STALE_LEAD_DAYS ?? '7', 10)
  const [stats, recentActivity, workspace, staleLeads, supabase] = await Promise.all([
    getCrmDashboardStats(), getRecentActivity(10), getWorkspaceData(), getStaleLeads(staleDays), createClient(),
  ])
  const { data: { user } } = await supabase.auth.getUser()
  const actor = user?.email === 'beslock@yahoo.com' ? 'billy' : 'neil'
  const today = detroitDate()

  return <div className="mx-auto max-w-[1600px] space-y-7">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">CRM / Daily outreach</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Outreach workspace</h1><p className="mt-2 text-sm text-slate-500">Turn course outreach into conversations and clear next steps.</p></div>
      <Link href="/admin/crm/courses/new" className="rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-900">+ Add course</Link>
    </header>
    <nav aria-label="CRM tools" className="flex flex-wrap gap-x-5 gap-y-3 border-b border-slate-200 pb-5 text-sm font-medium text-slate-600">
      {[
        ['courses', 'Course pipeline'], ['tasks', 'All tasks'], ['outings', 'Outings'], ['members', 'Members'],
        ['email-templates', 'Email templates'], ['email-performance', 'Email performance'], ['import', 'Import courses'],
      ].map(([path, label]) => <Link key={path} href={`/admin/crm/${path}`} className="hover:text-emerald-700">{label}</Link>)}
    </nav>
    <OutreachWorkspace {...workspace} today={today} actor={actor} />
    <details className="rounded-2xl border border-slate-200 bg-white p-5">
      <summary className="cursor-pointer font-semibold text-slate-800">Business overview & recent activity</summary>
      <div className="mt-5 space-y-6"><KPITiles stats={stats} /><div className="flex gap-4 text-sm font-medium text-emerald-700"><Link href="/admin/crm/outings/new">+ Add outing</Link><Link href="/admin/crm/members/new">+ Add member</Link></div><StaleLeadAlert {...staleLeads} staleDays={staleDays} /><ActivityFeed activities={recentActivity} /></div>
    </details>
  </div>
}
