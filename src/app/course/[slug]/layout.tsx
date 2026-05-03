import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { MANAGER_ROLES } from '@/lib/courseRole'
import { ServiceInboxWidget } from '@/components/ServiceInbox/ServiceInboxWidget'

export default async function CourseAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/course/${slug}/login`)

  const { data: course } = await supabase
    .from('courses')
    .select('id, name, slug, service_requests_enabled')
    .eq('slug', slug)
    .single()

  if (!course) notFound()

  const admin = createAdminClient()
  const [
    { data: profile },
    { data: courseAdmin },
    { data: courseUser },
  ] = await Promise.all([
    admin.from('profiles').select('is_admin').eq('id', user.id).single(),
    admin.from('course_admins').select('role').eq('user_id', user.id).eq('course_id', course.id).single(),
    admin.from('crm_course_users').select('role').eq('user_id', user.id).eq('course_id', course.id).single(),
  ])

  const isGlobalAdmin = profile?.is_admin === true
  if (!isGlobalAdmin && !courseAdmin && !courseUser) redirect(`/course/${slug}/login`)

  const role = isGlobalAdmin ? 'owner' : (courseAdmin?.role ?? courseUser?.role ?? 'staff')
  const isManager = isGlobalAdmin || MANAGER_ROLES.includes(role)

  const allNavItems = [
    { href: `/course/${slug}`,            label: 'Tee Sheet',  managerOnly: false },
    { href: `/course/${slug}/check-in`,   label: 'Check-in',   managerOnly: false },
    { href: `/course/${slug}/bookings`,   label: 'Bookings',   managerOnly: false },
    { href: `/course/${slug}/members`,    label: 'Members',    managerOnly: false },
    { href: `/course/${slug}/payments`,   label: 'Payments',   managerOnly: true },
    { href: `/course/${slug}/dashboard`,  label: 'Dashboard',  managerOnly: true },
    { href: `/course/${slug}/reports`,    label: 'Reports',    managerOnly: true },
    { href: `/course/${slug}/leagues`,    label: 'Leagues',    managerOnly: true },
    { href: `/course/${slug}/trading`,   label: 'Trading',    managerOnly: true },
    { href: `/course/${slug}/billing`,    label: 'Billing',    managerOnly: true },
    { href: `/course/${slug}/settings`,   label: 'Settings',   managerOnly: true },
    { href: `/course/${slug}/install`,    label: 'Install',    managerOnly: true },
  ]

  const navItems = allNavItems.filter(item => !item.managerOnly || isManager)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#1B4332] text-[#FAF7F2] px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/app" className="text-[#FAF7F2]/60 hover:text-[#FAF7F2] text-sm">← teeahead</Link>
            <span className="text-[#FAF7F2]/40">|</span>
            <span className="font-semibold">{course.name}</span>
          </div>
          <span className="text-xs text-[#FAF7F2]/60 uppercase tracking-wider">{role}</span>
        </div>
      </header>
      <nav className="bg-white border-b border-gray-200 px-6">
        <div className="max-w-7xl mx-auto flex gap-0">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="px-4 py-3 text-sm font-medium text-[#6B7770] hover:text-[#1A1A1A] border-b-2 border-transparent hover:border-[#1B4332] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-6">
        {children}
      </main>
      <ServiceInboxWidget
        courseId={course.id}
        serviceRequestsEnabled={course.service_requests_enabled ?? true}
      />
    </div>
  )
}
