import Link from 'next/link'
import type { CrmCourse } from '@/lib/crm/types'

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

function parseNote(notes: string | null | undefined, key: string): string | null {
  if (!notes) return null
  const m = notes.match(new RegExp(key + ': ([^|]+)'))
  return m ? m[1].trim() : null
}

interface Props {
  course: CrmCourse
  isDragging?: boolean
}

export function CourseKanbanCard({ course, isDragging }: Props) {
  const stale = daysSince(course.last_activity_at) >= 7
  const software = parseNote(course.notes, 'Software')
  const daysSinceEmail = course.last_email_at != null ? daysSince(course.last_email_at) : null
  // Color the badge by recency: fresh (≤3d) = emerald, mid (4-7d) = slate, stale (8+) = amber.
  const emailBadgeColor =
    daysSinceEmail == null ? '' :
    daysSinceEmail <= 3 ? 'bg-emerald-50 text-emerald-700' :
    daysSinceEmail <= 7 ? 'bg-slate-100 text-slate-600' :
    'bg-amber-100 text-amber-700'

  return (
    <div
      className={`bg-white rounded-lg border p-3 shadow-sm cursor-grab select-none
        ${stale ? 'border-amber-400' : 'border-slate-200'}
        ${isDragging ? 'shadow-lg rotate-1 scale-105' : ''}
      `}
    >
      <Link
        href={`/admin/crm/courses/${course.id}`}
        className="font-medium text-slate-800 text-sm hover:text-emerald-700 block mb-1"
        onClick={(e) => e.stopPropagation()}
      >
        {course.name}
      </Link>
      {course.contact_name && (
        <p className="text-xs text-slate-500">{course.contact_name}</p>
      )}
      {software && (
        <span className="inline-block mt-1 text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
          {software}
        </span>
      )}
      <div className="flex items-center justify-between mt-2">
        {course.estimated_value != null && (
          <span className="text-xs font-medium text-emerald-700">
            ${course.estimated_value.toLocaleString()}/yr
          </span>
        )}
        <div className="flex items-center gap-1.5 ml-auto">
          {(course.email_count ?? 0) > 0 && (
            <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">
              ✉ {course.email_count}
            </span>
          )}
          {daysSinceEmail != null && (
            <span
              title={`Last email ${daysSinceEmail}d ago`}
              className={`text-xs px-1.5 py-0.5 rounded-full ${emailBadgeColor}`}
            >
              {daysSinceEmail}d
            </span>
          )}
          {stale && (
            <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
              {daysSince(course.last_activity_at)}d stale
            </span>
          )}
          {!stale && course.assigned_to && (
            <span className="text-xs text-slate-400 capitalize">{course.assigned_to}</span>
          )}
        </div>
      </div>
    </div>
  )
}
