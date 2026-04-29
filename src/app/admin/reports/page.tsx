import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = { title: 'Reports' }

export default async function AdminReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/app')

  const reports = [
    {
      href: '/admin/reports/financial',
      title: 'Financial Reports',
      description: 'MRR, ARR, revenue by stream, P&L with expense tracking, PDF export',
      icon: '💰',
    },
    {
      href: '/admin/reports/members',
      title: 'Member Reports',
      description: 'Growth, churn, cohort retention, LTV analysis, at-risk members',
      icon: '📈',
    },
    {
      href: '/admin/reports/courses',
      title: 'Course Network Reports',
      description: 'Health scores, all-courses summary, individual course drilldowns',
      icon: '🏌️',
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Reports</h1>
      <p className="text-[#6B7770] mb-8">Platform analytics and reporting for admins.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {reports.map(r => (
          <Link key={r.href} href={r.href}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-[#1B4332] transition-all group">
            <div className="text-3xl mb-3">{r.icon}</div>
            <h2 className="font-semibold text-[#1A1A1A] group-hover:text-[#1B4332] mb-1">{r.title}</h2>
            <p className="text-sm text-[#6B7770]">{r.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
