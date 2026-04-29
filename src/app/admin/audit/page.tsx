import { createAdminClient } from '@/lib/supabase/admin'
import AuditLogFilters from '@/components/admin/AuditLogFilters'
import Link from 'next/link'
import { Suspense } from 'react'

export const metadata = { title: 'Audit Log' }

const PAGE_SIZE = 25

const TAG_STYLE: Record<string, string> = {
  membership_cancelled: 'bg-red-100 text-red-700',
  refund_issued: 'bg-amber-100 text-amber-800',
  tier_changed: 'bg-violet-100 text-violet-700',
  content_edited: 'bg-blue-100 text-blue-700',
  config_changed: 'bg-emerald-100 text-emerald-700',
  member_created: 'bg-slate-100 text-slate-600',
  member_deleted: 'bg-slate-100 text-slate-600',
  dispute_updated: 'bg-orange-100 text-orange-700',
  email_sent: 'bg-pink-100 text-pink-700',
  credit_added: 'bg-teal-100 text-teal-700',
  points_adjusted: 'bg-indigo-100 text-indigo-700',
  admin_note_added: 'bg-slate-100 text-slate-600',
  profile_updated: 'bg-slate-100 text-slate-600',
}

function tagLabel(eventType: string) {
  return eventType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function detailSummary(details: any): string {
  if (!details) return ''
  if (details.old_value !== undefined && details.new_value !== undefined) {
    return `${details.old_value ?? '—'} → ${details.new_value}`
  }
  if (details.action) return String(details.action).replace(/_/g, ' ')
  if (details.note) return `"${String(details.note).slice(0, 60)}"`
  if (details.subject) return `"${String(details.subject).slice(0, 60)}"`
  return ''
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; event_type?: string; range?: string; page?: string }>
}) {
  const { q, event_type, range = '30d', page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const admin = createAdminClient()
  let query = admin
    .from('admin_audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (event_type) query = query.eq('event_type', event_type)
  if (range !== 'all') {
    const days = range === '7d' ? 7 : 30
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    query = query.gte('created_at', cutoff.toISOString())
  }
  if (q) {
    query = query.or(`target_label.ilike.%${q}%,admin_email.ilike.%${q}%`)
  }

  const { data: rows, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  function pageLink(p: number) {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (event_type) params.set('event_type', event_type)
    params.set('range', range)
    params.set('page', String(p))
    return `/admin/audit?${params.toString()}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Audit Log</h1>
        <p className="text-[#6B7770] text-sm mt-1">All admin actions, newest first</p>
      </div>

      <Suspense>
        <AuditLogFilters />
      </Suspense>

      <div className="bg-white rounded-xl ring-1 ring-black/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#FAF7F2] text-[#6B7770] border-b border-black/5">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Action</th>
              <th className="text-left px-4 py-3 font-medium">Details</th>
              <th className="text-left px-4 py-3 font-medium">Admin</th>
              <th className="text-left px-4 py-3 font-medium">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {(rows ?? []).length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[#6B7770]">No actions found.</td>
              </tr>
            ) : (rows ?? []).map((row: any) => (
              <tr key={row.id} className="hover:bg-[#FAF7F2]/40">
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${TAG_STYLE[row.event_type] ?? 'bg-slate-100 text-slate-600'}`}>
                    {tagLabel(row.event_type)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium text-[#1A1A1A]">{row.target_label || '—'}</span>
                  {detailSummary(row.details) && (
                    <p className="text-xs text-[#6B7770] mt-0.5">{detailSummary(row.details)}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-[#6B7770] text-xs">{row.admin_email}</td>
                <td className="px-4 py-3 text-[#6B7770] text-xs whitespace-nowrap">
                  {new Date(row.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: 'numeric', minute: '2-digit',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-[#6B7770]">
          <span>Showing {from + 1}–{Math.min(to + 1, count ?? 0)} of {count} actions</span>
          <div className="flex gap-1">
            {page > 1 && (
              <Link href={pageLink(page - 1)} className="rounded border border-black/15 px-3 py-1 hover:bg-[#FAF7F2]">←</Link>
            )}
            {page < totalPages && (
              <Link href={pageLink(page + 1)} className="rounded border border-black/15 px-3 py-1 hover:bg-[#FAF7F2]">→</Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
