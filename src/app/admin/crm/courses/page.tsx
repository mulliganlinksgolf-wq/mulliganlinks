export const metadata = { title: 'CRM Courses' }

import { Suspense } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { CourseKanban } from '@/components/crm/CourseKanban'
import { CoursesTableWrapper } from './CoursesTableWrapper'
import CoursesViewToggle from './CoursesViewToggle'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getCourses() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('crm_courses')
    .select('*')
    .order('last_activity_at', { ascending: false })
  return data ?? []
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const params = await searchParams
  const view = params.view ?? 'kanban'
  const courses = await getCourses()

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Course Pipeline</h1>
        <div className="flex items-center gap-3">
          <CoursesViewToggle currentView={view} />
          <Link
            href="/admin/crm/courses/outreach-queue"
            className="px-3 py-1.5 border border-emerald-600 text-emerald-700 text-sm font-medium rounded-lg hover:bg-emerald-50"
          >
            Today's Queue
          </Link>
          <Link
            href="/admin/crm/courses/new"
            className="px-3 py-1.5 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800"
          >
            + New Course
          </Link>
        </div>
      </div>

      {view === 'kanban' ? (
        <Suspense>
          <CourseKanban initialCourses={courses} />
        </Suspense>
      ) : (
        <CoursesTableWrapper courses={courses} />
      )}
    </div>
  )
}
