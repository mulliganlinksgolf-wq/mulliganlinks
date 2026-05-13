import { createAdminClient } from '@/lib/supabase/admin'
import { SyncButton } from './SyncButton'

export const metadata = { title: 'Email Performance' }
export const dynamic = 'force-dynamic'

function pct(opened: number, sent: number) {
  if (!sent) return '—'
  return `${Math.round((opened / sent) * 100)}%`
}

export default async function EmailPerformancePage() {
  const admin = createAdminClient()

  // All email activities
  const { data: activities } = await admin
    .from('crm_activity_log')
    .select('id, opened_at, open_count, from_email, record_type, record_id, body, created_at')
    .eq('type', 'email')
    .order('created_at', { ascending: false })

  const rows = activities ?? []

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const recentRows = rows.filter(r => r.created_at >= thirtyDaysAgo)

  const totalSent = rows.length
  const totalOpened = rows.filter(r => r.opened_at).length
  const recentSent = recentRows.length
  const recentOpened = recentRows.filter(r => r.opened_at).length

  // By sender
  const bySender: Record<string, { sent: number; opened: number }> = {}
  for (const r of rows) {
    const key = r.from_email ?? 'hello@teeahead.com'
    bySender[key] ??= { sent: 0, opened: 0 }
    bySender[key].sent++
    if (r.opened_at) bySender[key].opened++
  }

  // By record type
  const byType: Record<string, { sent: number; opened: number }> = {}
  for (const r of rows) {
    const key = r.record_type as string
    byType[key] ??= { sent: 0, opened: 0 }
    byType[key].sent++
    if (r.opened_at) byType[key].opened++
  }

  // By template — derive template name from subject in body ("Subject: ...")
  const byTemplate: Record<string, { sent: number; opened: number; lastSent: string }> = {}
  for (const r of rows) {
    const subjectMatch = (r.body ?? '').match(/Subject:\s*(.+)/)
    const subject = subjectMatch?.[1]?.trim() ?? '(no subject)'
    byTemplate[subject] ??= { sent: 0, opened: 0, lastSent: r.created_at }
    byTemplate[subject].sent++
    if (r.opened_at) byTemplate[subject].opened++
    if (r.created_at > byTemplate[subject].lastSent) byTemplate[subject].lastSent = r.created_at
  }
  const templateRows = Object.entries(byTemplate).sort((a, b) => b[1].sent - a[1].sent)

  // Opened rows — build per-contact detail list
  const openedRows = rows.filter(r => r.opened_at)

  // Batch-fetch contact names for opened rows only
  const courseIds = [...new Set(openedRows.filter(r => r.record_type === 'course').map(r => r.record_id))]
  const outingIds = [...new Set(openedRows.filter(r => r.record_type === 'outing').map(r => r.record_id))]
  const memberIds = [...new Set(openedRows.filter(r => r.record_type === 'member').map(r => r.record_id))]

  const [{ data: courseNames }, { data: outingNames }, { data: memberNames }] = await Promise.all([
    courseIds.length ? admin.from('crm_courses').select('id, name').in('id', courseIds) : { data: [] },
    outingIds.length ? admin.from('crm_outings').select('id, name').in('id', outingIds) : { data: [] },
    memberIds.length ? admin.from('crm_members').select('id, first_name, last_name').in('id', memberIds) : { data: [] },
  ])

  const nameMap: Record<string, string> = {}
  for (const c of (courseNames ?? [])) nameMap[`course:${c.id}`] = c.name ?? '(course)'
  for (const o of (outingNames ?? [])) nameMap[`outing:${o.id}`] = o.name ?? '(outing)'
  for (const m of (memberNames ?? [])) nameMap[`member:${m.id}`] = [m.first_name, m.last_name].filter(Boolean).join(' ') || '(member)'

  function recordLink(recordType: string, recordId: string) {
    if (recordType === 'course') return `/admin/crm/courses/${recordId}`
    if (recordType === 'outing') return `/admin/crm/outings/${recordId}`
    return `/admin/crm/members/${recordId}`
  }

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso))

  const formatDateTime = (iso: string) =>
    new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
      timeZone: 'America/Detroit',
    }).format(new Date(iso))

  return (
    <div className="max-w-4xl space-y-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Email Performance</h1>
          <p className="text-[#6B7770] text-sm mt-1">Open tracking for CRM emails sent via TeeAhead.</p>
        </div>
        <SyncButton />
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total sent (all time)', value: totalSent },
          { label: 'Total sent (30 days)', value: recentSent },
          { label: 'Open rate (all time)', value: pct(totalOpened, totalSent) },
          { label: 'Open rate (30 days)', value: pct(recentOpened, recentSent) },
        ].map(card => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs text-slate-500">{card.label}</p>
            <p className="text-2xl font-bold text-[#1A1A1A] mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* By sender */}
      <div>
        <h2 className="text-base font-semibold text-[#1A1A1A] mb-3">By sender</h2>
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">Sender</th>
                <th className="px-4 py-3 text-right text-slate-600 font-medium">Sent</th>
                <th className="px-4 py-3 text-right text-slate-600 font-medium">Opened</th>
                <th className="px-4 py-3 text-right text-slate-600 font-medium">Open rate</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(bySender).map(([sender, s]) => (
                <tr key={sender} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-700">{sender}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{s.sent}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{s.opened}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700">{pct(s.opened, s.sent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* By contact type */}
      <div>
        <h2 className="text-base font-semibold text-[#1A1A1A] mb-3">By contact type</h2>
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">Type</th>
                <th className="px-4 py-3 text-right text-slate-600 font-medium">Sent</th>
                <th className="px-4 py-3 text-right text-slate-600 font-medium">Open rate</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(byType).map(([type, s]) => (
                <tr key={type} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-700 capitalize">{type}s</td>
                  <td className="px-4 py-3 text-right text-slate-700">{s.sent}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700">{pct(s.opened, s.sent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Who opened */}
      <div>
        <h2 className="text-base font-semibold text-[#1A1A1A] mb-1">Who opened</h2>
        <p className="text-xs text-slate-500 mb-3">Emails confirmed opened by the recipient — sorted by most recent open.</p>
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">Contact</th>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">Subject</th>
                <th className="px-4 py-3 text-right text-slate-600 font-medium">Sent</th>
                <th className="px-4 py-3 text-right text-slate-600 font-medium">Opened</th>
                <th className="px-4 py-3 text-right text-slate-600 font-medium">Opens</th>
              </tr>
            </thead>
            <tbody>
              {openedRows
                .sort((a, b) => (b.opened_at ?? '').localeCompare(a.opened_at ?? ''))
                .map(r => {
                  const nameKey = `${r.record_type}:${r.record_id}`
                  const contactName = nameMap[nameKey] ?? r.record_type
                  const subjectMatch = (r.body ?? '').match(/Subject:\s*(.+)/)
                  const subject = subjectMatch?.[1]?.trim() ?? '(no subject)'
                  const toMatch = (r.body ?? '').match(/^To:\s*(.+)/m)
                  const toEmail = toMatch?.[1]?.trim() ?? ''
                  return (
                    <tr key={r.id} className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        <a
                          href={recordLink(r.record_type, r.record_id)}
                          className="font-medium text-emerald-700 hover:underline"
                        >
                          {contactName}
                        </a>
                        {toEmail && (
                          <div className="text-xs text-slate-400 mt-0.5">{toEmail}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700 max-w-[220px] truncate" title={subject}>{subject}</td>
                      <td className="px-4 py-3 text-right text-slate-500 whitespace-nowrap">{formatDateTime(r.created_at)}</td>
                      <td className="px-4 py-3 text-right text-emerald-700 font-medium whitespace-nowrap">{formatDateTime(r.opened_at!)}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{r.open_count ?? 1}</td>
                    </tr>
                  )
                })}
              {openedRows.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No opens recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* By template (subject) */}
      <div>
        <h2 className="text-base font-semibold text-[#1A1A1A] mb-3">By template / subject</h2>
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">Subject</th>
                <th className="px-4 py-3 text-right text-slate-600 font-medium">Sent</th>
                <th className="px-4 py-3 text-right text-slate-600 font-medium">Opened</th>
                <th className="px-4 py-3 text-right text-slate-600 font-medium">Open rate</th>
                <th className="px-4 py-3 text-right text-slate-600 font-medium">Last sent</th>
              </tr>
            </thead>
            <tbody>
              {templateRows.map(([subject, s]) => (
                <tr key={subject} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-700 max-w-xs truncate">{subject}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{s.sent}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{s.opened}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700">{pct(s.opened, s.sent)}</td>
                  <td className="px-4 py-3 text-right text-slate-500">{formatDate(s.lastSent)}</td>
                </tr>
              ))}
              {templateRows.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No emails sent yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
