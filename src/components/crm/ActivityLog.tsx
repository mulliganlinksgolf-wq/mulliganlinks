import type { CrmActivityLog as CrmActivityLogType, CrmActivityType } from '@/lib/crm/types'

const icons: Record<CrmActivityType, string> = {
  call: '📞', email: '✉️', note: '📝',
  meeting: '🤝', demo: '💻', contract_sent: '📄',
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(new Date(iso))
}

interface Props {
  activities: CrmActivityLogType[]
}

export function ActivityLog({ activities }: Props) {
  if (activities.length === 0) {
    return <p className="text-sm text-slate-400">No activity logged yet.</p>
  }
  return (
    <ul className="space-y-4">
      {activities.map((a) => (
        <li key={a.id} className="flex gap-3">
          <span className="text-lg mt-0.5">{icons[a.type]}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700 capitalize">{a.type.replace('_', ' ')}</span>
              <span>·</span>
              <span>{a.created_by}</span>
              <span>·</span>
              <span>{formatDate(a.created_at)}</span>
            </div>
            {a.body && <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{a.body}</p>}
          </div>
        </li>
      ))}
    </ul>
  )
}
