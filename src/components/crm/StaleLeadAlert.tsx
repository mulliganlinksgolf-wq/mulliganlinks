'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { StaleLeadSummary } from '@/lib/crm/types'

interface Props extends StaleLeadSummary {
  staleDays: number
}

const PAGE_SIZE = 6

export function StaleLeadAlert({ staleCourses, staleOutings, staleDays }: Props) {
  const [page, setPage] = useState(0)
  const leads = [
    ...staleCourses.map(course => ({ ...course, kind: 'Course', label: course.name, status: course.stage, href: `/admin/crm/courses/${course.id}` })),
    ...staleOutings.map(outing => ({ ...outing, kind: 'Outing', label: outing.contact_name, href: `/admin/crm/outings/${outing.id}` })),
  ]
  const total = leads.length
  if (total === 0) return null

  const pageCount = Math.ceil(total / PAGE_SIZE)
  const currentPage = Math.min(page, pageCount - 1)
  const start = currentPage * PAGE_SIZE

  return (
    <section aria-label="Stale leads" className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Leads to reconnect with</h2>
          <p className="mt-1 text-xs text-slate-500">No activity in {staleDays}+ days</p>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">{total} stale lead{total !== 1 ? 's' : ''}</span>
      </div>
      <ul className="divide-y divide-slate-100">
        {leads.slice(start, start + PAGE_SIZE).map(lead => (
          <li key={lead.href} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-5">
            <div className="min-w-0 flex-1 basis-48">
              <Link href={lead.href} className="break-words text-sm font-medium text-slate-800 hover:text-emerald-700 hover:underline">{lead.label}</Link>
              <p className="mt-1 text-xs text-slate-500">{lead.kind} · <span className="capitalize">{lead.assigned_to ?? 'Unassigned'}</span></p>
            </div>
            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs capitalize text-slate-600">{lead.status.replaceAll('_', ' ')}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
        <p aria-live="polite" className="text-xs text-slate-500">Showing {start + 1}–{Math.min(start + PAGE_SIZE, total)} of {total}</p>
        {pageCount > 1 && <nav aria-label="Stale lead pages" className="flex items-center gap-2">
          <button type="button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
          <button type="button" disabled={currentPage === pageCount - 1} onClick={() => setPage(currentPage + 1)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
        </nav>}
      </div>
    </section>
  )
}
