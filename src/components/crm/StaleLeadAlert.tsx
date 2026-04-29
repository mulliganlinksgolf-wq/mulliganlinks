import Link from 'next/link'
import type { StaleLeadSummary } from '@/lib/crm/types'

interface Props extends StaleLeadSummary {
  staleDays: number
}

export function StaleLeadAlert({ staleCourses, staleOutings, staleDays }: Props) {
  const total = staleCourses.length + staleOutings.length
  if (total === 0) return null

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-amber-600 font-semibold text-sm">
          ⚠️ {total} stale lead{total !== 1 ? 's' : ''} — no activity in {staleDays}+ days
        </span>
      </div>
      <ul className="space-y-1">
        {staleCourses.map((course) => (
          <li key={course.id} className="text-sm flex items-center gap-2">
            <span className="text-amber-500">🏌️</span>
            <Link href={`/admin/crm/courses/${course.id}`} className="text-amber-800 hover:underline font-medium">
              {course.name}
            </Link>
            <span className="text-amber-600 capitalize">({course.stage})</span>
            {course.assigned_to && (
              <span className="text-amber-500 text-xs">→ {course.assigned_to}</span>
            )}
          </li>
        ))}
        {staleOutings.map((outing) => (
          <li key={outing.id} className="text-sm flex items-center gap-2">
            <span className="text-amber-500">📅</span>
            <Link href={`/admin/crm/outings/${outing.id}`} className="text-amber-800 hover:underline font-medium">
              {outing.contact_name}
            </Link>
            <span className="text-amber-600 capitalize">({outing.status})</span>
            {outing.assigned_to && (
              <span className="text-amber-500 text-xs">→ {outing.assigned_to}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
