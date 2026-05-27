import type { CrmActivityLog, CrmActivityType, CrmRecordType } from '@/lib/crm/types'
import Link from 'next/link'

const activityIcons: Record<CrmActivityType, string> = {
  call: '📞',
  email: '✉️',
  note: '📝',
  meeting: '🤝',
  demo: '💻',
  contract_sent: '📄',
}

const recordLabels: Record<CrmRecordType, string> = {
  course: 'Course',
  outing: 'Outing',
  member: 'Member',
}

const recordPaths: Record<CrmRecordType, string> = {
  course: '/admin/crm/courses',
  outing: '/admin/crm/outings',
  member: '/admin/crm/members',
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

interface Props {
  activities: CrmActivityLog[]
}

export function ActivityFeed({ activities }: Props) {
  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-800 mb-3">Recent Activity</h2>
        <p className="text-sm text-slate-400">No activity logged yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="font-semibold text-slate-800 mb-4">Recent Activity</h2>
      <ul className="space-y-3">
        {activities.map((entry) => (
          <li key={entry.id} className="flex items-start gap-3 text-sm">
            <span className="mt-0.5 text-base">{activityIcons[entry.type]}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-700 capitalize">{entry.type.replace('_', ' ')}</span>
                <span className="text-slate-400">·</span>
                <Link
                  href={`${recordPaths[entry.record_type]}/${entry.record_id}`}
                  className="text-emerald-600 hover:underline"
                >
                  {recordLabels[entry.record_type]}
                </Link>
                <span className="text-slate-400">·</span>
                <span className="text-slate-400">{entry.created_by}</span>
              </div>
              {entry.body && (
                <p className="text-slate-500 truncate mt-0.5">{entry.body}</p>
              )}
            </div>
            <span className="text-slate-400 text-xs whitespace-nowrap">{timeAgo(entry.created_at)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
