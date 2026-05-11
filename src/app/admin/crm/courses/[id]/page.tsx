import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { RecordHeader } from '@/components/crm/RecordHeader'
import { ActivityLog } from '@/components/crm/ActivityLog'
import { DocumentList } from '@/components/crm/DocumentList'
import { CourseContactsSection } from '@/components/crm/CourseContactsSection'
import { RecordTasksSection } from '@/components/crm/RecordTasksSection'
import { CourseDetailClient } from './CourseDetailClient'
import { getActivityLog } from '@/app/actions/crm/activity'
import type { CrmCourse, CrmCourseContact, CrmTask } from '@/lib/crm/types'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data } = await supabase.from('crm_courses').select('name').eq('id', id).single()
  return { title: data?.name ? `${data.name} | CRM Courses` : 'Course Detail' }
}

async function getCourseData(id: string): Promise<{
  course: CrmCourse | null
  contacts: CrmCourseContact[]
  tasks: CrmTask[]
}> {
  const supabase = createAdminClient()
  const [courseRes, contactsRes, tasksRes] = await Promise.all([
    supabase.from('crm_courses').select('*').eq('id', id).single(),
    supabase.from('crm_course_contacts').select('*').eq('course_id', id).order('is_primary', { ascending: false }).order('created_at', { ascending: true }),
    supabase.from('crm_tasks').select('*').eq('record_type', 'course').eq('record_id', id).order('completed_at', { ascending: true, nullsFirst: true }).order('due_date', { ascending: true, nullsFirst: false }),
  ])
  return {
    course: courseRes.data ?? null,
    contacts: contactsRes.data ?? [],
    tasks: tasksRes.data ?? [],
  }
}

const stageColors: Record<string, 'green' | 'amber' | 'slate' | 'red' | 'blue'> = {
  partner: 'green',
  negotiating: 'blue',
  demo: 'amber',
  churned: 'red',
  lead: 'slate',
  contacted: 'slate',
}

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [{ course, contacts, tasks }, activities] = await Promise.all([
    getCourseData(id),
    getActivityLog('course', id),
  ])
  if (!course) notFound()

  return (
    <div className="p-6 max-w-5xl">
      <RecordHeader
        backHref="/admin/crm/courses"
        backLabel="Course Pipeline"
        title={course.name}
        subtitle={[course.city, course.state].filter(Boolean).join(', ')}
        badge={{ label: course.stage, color: stageColors[course.stage] ?? 'slate' }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <CourseDetailClient course={course} />
          <CourseContactsSection courseId={id} contacts={contacts} />
          <RecordTasksSection
            recordType="course"
            recordId={id}
            tasks={tasks}
            defaultAssignee={course.assigned_to ?? 'neil'}
          />
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4 text-sm uppercase tracking-wide">Activity Log</h3>
            <ActivityLog activities={activities} />
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4 text-sm uppercase tracking-wide">Documents</h3>
            <Suspense fallback={<p className="text-xs text-slate-400">Loading…</p>}>
              <DocumentList recordType="course" recordId={id} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
