// src/components/crm/ScheduledEmailsList.tsx
import { getScheduledEmails, cancelScheduledEmail } from '@/app/actions/crm/email'
import type { CrmRecordType } from '@/lib/crm/types'

interface Props {
  recordType: CrmRecordType
  recordId: string
}

function formatScheduled(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    timeZone: 'America/Detroit',
  }).format(new Date(iso))
}

export async function ScheduledEmailsList({ recordType, recordId }: Props) {
  const emails = await getScheduledEmails(recordType, recordId)
  if (emails.length === 0) return null

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <h3 className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-3">
        Scheduled Emails ({emails.length})
      </h3>
      <ul className="space-y-2">
        {emails.map((email) => (
          <li key={email.id} className="flex items-start justify-between gap-3 text-sm">
            <div className="min-w-0">
              <p className="font-medium text-slate-700 truncate">{email.subject}</p>
              <p className="text-xs text-slate-500">
                To: {email.to_email} · Sends {formatScheduled(email.scheduled_for)}
              </p>
            </div>
            <form
              action={async () => {
                'use server'
                await cancelScheduledEmail(email.id, recordType, recordId)
              }}
            >
              <button
                type="submit"
                className="text-xs text-red-500 hover:text-red-700 hover:underline shrink-0 mt-0.5"
              >
                Cancel
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  )
}
