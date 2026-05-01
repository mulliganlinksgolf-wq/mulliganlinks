import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCourseReportKpis } from '@/lib/reports/courseMetrics'
import { resolveDateRange } from '@/lib/reports/dateRange'
import KpiTile from '@/components/reports/KpiTile'
import DateRangePicker from '@/components/reports/DateRangePicker'

export default async function CourseReportsDashboard({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/course/${slug}/login`)

  const admin = createAdminClient()
  const { data: course, error: courseError } = await admin.from('courses').select('id, name, slug').eq('slug', slug).single()
  if (courseError && courseError.code !== 'PGRST116') throw new Error(`[CourseReportsDashboard] course query failed: ${courseError.message}`)
  if (!course) notFound()

  const sp = await searchParams
  const dateRange = resolveDateRange(sp.preset, sp.from, sp.to)
  const kpis = await getCourseReportKpis(course.id, dateRange.from, dateRange.to)

  const presetLabel: Record<string, string> = {
    this_month: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    last_month: 'Last Month',
    this_quarter: 'This Quarter',
    ytd: 'Year to Date',
    custom: `${dateRange.from} – ${dateRange.to}`,
  }

  const subPages = [
    { href: `/course/${slug}/reports/rounds`, label: 'Rounds & Utilization', icon: '⛳' },
    { href: `/course/${slug}/reports/revenue`, label: 'Revenue', icon: '💰' },
    { href: `/course/${slug}/reports/members`, label: 'Member Activity', icon: '👥' },
    { href: `/course/${slug}/reports/waitlist`, label: 'Waitlist & Recovery', icon: '📋' },
    { href: `/course/${slug}/reports/barter`, label: 'The TeeAhead Difference', icon: '🏆', highlight: true },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Your TeeAhead Performance</h1>
        <p className="text-[#6B7770] text-sm mt-1">{presetLabel[dateRange.preset] ?? dateRange.preset}</p>
      </div>

      <DateRangePicker />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiTile label="Rounds" value={kpis.roundsThisMonth.toLocaleString()} accent />
        <KpiTile label="Revenue Processed" value={`$${kpis.revenueThisMonth.toLocaleString()}`} />
        <KpiTile label="TeeAhead Members" value={kpis.membersTotal.toLocaleString()} />
        <KpiTile label="Waitlist Cancellations Recovered" value={kpis.waitlistFillsThisMonth.toString()} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {subPages.map(p => (
          <Link key={p.href} href={p.href}
            className={`rounded-xl border p-5 hover:shadow-md transition-all group ${
              p.highlight
                ? 'border-[#E0A800] bg-amber-50 hover:bg-amber-100'
                : 'border-gray-200 bg-white hover:border-[#1B4332]'
            }`}>
            <div className="text-2xl mb-2">{p.icon}</div>
            <h2 className={`font-semibold group-hover:text-[#1B4332] ${p.highlight ? 'text-amber-900' : 'text-[#1A1A1A]'}`}>
              {p.label}
            </h2>
          </Link>
        ))}
      </div>
    </div>
  )
}
