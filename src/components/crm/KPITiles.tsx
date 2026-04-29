import type { CrmDashboardStats } from '@/lib/crm/types'

interface Props {
  stats: CrmDashboardStats
}

function KPITile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{label}</div>
      <div className="text-3xl font-bold text-slate-900">{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  )
}

export function KPITiles({ stats }: Props) {
  const { pipelineCourses, activeOutings, payingMembers, pipelineValue } = stats
  const formattedValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(pipelineValue)

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KPITile label="Courses in Pipeline" value={String(pipelineCourses)} sub="excl. partner & churned" />
      <KPITile label="Active Outing Leads" value={String(activeOutings)} />
      <KPITile label="Paying Members" value={String(payingMembers)} sub="eagle + ace" />
      <KPITile label="Pipeline Value" value={formattedValue} sub="estimated annual" />
    </div>
  )
}
