'use client'

import { useState } from 'react'
import type { CrmActivityLog as CrmActivityLogType, CrmActivityType } from '@/lib/crm/types'

const icons: Record<CrmActivityType, string> = {
  call: '📞', email: '✉️', note: '📝',
  meeting: '🤝', demo: '💻', contract_sent: '📄',
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    timeZone: 'America/Detroit',
  }).format(new Date(iso))
}

function EmailActivityItem({ a }: { a: CrmActivityLogType }) {
  const [expanded, setExpanded] = useState(false)
  const subjectMatch = (a.body ?? '').match(/Subject:\s*(.+)/)
  const subject = subjectMatch?.[1]?.trim() ?? '(no subject)'
  const toMatch = (a.body ?? '').match(/^To:\s*(.+)/m)
  const to = toMatch?.[1]?.trim() ?? ''

  return (
    <li className="flex gap-3">
      <span className="text-lg mt-0.5">{icons['email']}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Email</span>
          <span>·</span>
          <span>{a.created_by}</span>
          <span>·</span>
          <span>{formatDate(a.created_at)}</span>
          {a.opened_at ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
              ✓ Opened{a.open_count > 1 ? ` ×${a.open_count}` : ''}
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-50 text-slate-400 font-medium border border-slate-200">
              Not opened
            </span>
          )}
        </div>
        <div className="mt-1 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate">{subject}</p>
            {to && <p className="text-xs text-slate-400">To: {to}</p>}
          </div>
          {a.email_html && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-emerald-600 hover:underline shrink-0 mt-0.5"
            >
              {expanded ? 'Hide' : 'View'}
            </button>
          )}
        </div>
        {expanded && a.email_html && (
          <div
            className="mt-2 p-3 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: a.email_html }}
          />
        )}
      </div>
    </li>
  )
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
        a.type === 'email' ? (
          <EmailActivityItem key={a.id} a={a} />
        ) : (
          <li key={a.id} className="flex gap-3">
            <span className="text-lg mt-0.5">{icons[a.type]}</span>
            <div className="flex-1">
              <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-700 capitalize">{a.type.replace('_', ' ')}</span>
                <span>·</span>
                <span>{a.created_by}</span>
                <span>·</span>
                <span>{formatDate(a.created_at)}</span>
              </div>
              {a.body && <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{a.body}</p>}
            </div>
          </li>
        )
      ))}
    </ul>
  )
}
