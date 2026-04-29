import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { RecordHeader } from '@/components/crm/RecordHeader'
import { ActivityLog } from '@/components/crm/ActivityLog'
import { CourseDetailClient } from './CourseDetailClient'
import { getActivityLog } from '@/app/actions/crm/activity'
import type { CrmCourse } from '@/lib/crm/types'

export const dynamic = 'force-dynamic'

async function getCourse(id: string): Promise<CrmCourse | null> {
  const supabase = createAdminClient()
  const { data } = await supabase.from('crm_courses').select('*').eq('id', id).single()
  return data ?? null
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
  const [course, activities] = await Promise.all([
    getCourse(id),
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
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4 text-sm uppercase tracking-wide">Activity Log</h3>
            <ActivityLog activities={activities} />
          </div>
        </div>
      </div>
    </div>
  )
}
