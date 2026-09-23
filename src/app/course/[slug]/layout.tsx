import styles from '@/components/course/course-portal.module.css'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { MANAGER_ROLES } from '@/lib/courseRole'
import { ServiceInboxWidget } from '@/components/ServiceInbox/ServiceInboxWidget'
import { CourseSidebar } from '@/components/course/CourseSidebar'

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
    admin.from('profiles').select('is_admin, full_name').eq('id', user.id).single(),
    admin.from('course_admins').select('role').eq('user_id', user.id).eq('course_id', course.id).single(),
    admin.from('crm_course_users').select('role').eq('user_id', user.id).eq('course_id', course.id).single(),
  ])

  const isGlobalAdmin = profile?.is_admin === true
  if (!isGlobalAdmin && !courseAdmin && !courseUser) redirect(`/course/${slug}/unauthorized`)

  const role = isGlobalAdmin ? 'owner' : (courseAdmin?.role ?? courseUser?.role ?? 'staff')
  const isManager = isGlobalAdmin || MANAGER_ROLES.includes(role)

  const fullName = (profile as { full_name?: string } | null)?.full_name
    ?? user.email?.split('@')[0]
    ?? 'You'
  const userInitials = fullName.split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase() || 'U'

  return (
    <div className={styles.shell}>
      <a href="#course-content" className={styles.skipLink}>Skip to course content</a>
      <CourseSidebar
        slug={slug}
        courseName={course.name}
        role={role}
        isManager={isManager}
        userInitials={userInitials}
        userName={fullName}
      />

      <div id="course-content" tabIndex={-1} className={styles.content}>
        {children}
      </div>

      <ServiceInboxWidget
        courseId={course.id}
        serviceRequestsEnabled={course.service_requests_enabled ?? true}
      />
    </div>
  )
}
