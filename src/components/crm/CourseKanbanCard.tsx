import Link from 'next/link'
import type { CrmCourse } from '@/lib/crm/types'

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

interface Props {
  course: CrmCourse
  isDragging?: boolean
}

export function CourseKanbanCard({ course, isDragging }: Props) {
  const stale = daysSince(course.last_activity_at) >= 7
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
      <div className="flex items-center justify-between mt-2">
        {course.estimated_value != null && (
          <span className="text-xs font-medium text-emerald-700">
            ${course.estimated_value.toLocaleString()}/yr
          </span>
        )}
        {stale && (
          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full ml-auto">
            {daysSince(course.last_activity_at)}d stale
          </span>
        )}
        {!stale && course.assigned_to && (
          <span className="text-xs text-slate-400 ml-auto capitalize">{course.assigned_to}</span>
        )}
      </div>
    </div>
  )
}
