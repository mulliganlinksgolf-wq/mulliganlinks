'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { CrmOuting, CrmOutingStatus } from '@/lib/crm/types'
import { updateOuting } from '@/app/actions/crm/outings'

const STATUSES: CrmOutingStatus[] = ['lead', 'quoted', 'confirmed', 'completed', 'cancelled']

const statusColors: Record<CrmOutingStatus, string> = {
  lead: 'bg-slate-100 text-slate-600',
  quoted: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-500',
}

interface Props {
  initialOutings: CrmOuting[]
  onExportCsv: () => void
}

export function OutingTable({ initialOutings, onExportCsv }: Props) {
  const [outings, setOutings] = useState(initialOutings)

  async function handleStatusChange(id: string, status: CrmOutingStatus) {
    setOutings((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))
    await updateOuting(id, { status })
  }

  const sorted = [...outings].sort((a, b) => {
    if (!a.event_date) return 1
    if (!b.event_date) return -1
    return a.event_date.localeCompare(b.event_date)
  })

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={onExportCsv} className="text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded px-3 py-1">
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">Contact</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">Event Date</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">Golfers</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">Budget</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">Status</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">Assigned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((outing) => (
              <tr key={outing.id} className="hover:bg-slate-50">
                <td className="px-3 py-2">
                  <Link href={`/admin/crm/outings/${outing.id}`} className="font-medium text-slate-800 hover:text-emerald-700">
                    {outing.contact_name}
                  </Link>
                  {outing.preferred_course && <div className="text-xs text-slate-400">{outing.preferred_course}</div>}
                </td>
                <td className="px-3 py-2 text-slate-600">
                  {outing.event_date ? new Date(outing.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </td>
                <td className="px-3 py-2 text-slate-600">{outing.num_golfers ?? '—'}</td>
                <td className="px-3 py-2 text-slate-600">
                  {outing.budget_estimate != null ? `$${outing.budget_estimate.toLocaleString()}` : '—'}
                </td>
                <td className="px-3 py-2">
                  <select
                    value={outing.status}
                    onChange={(e) => handleStatusChange(outing.id, e.target.value as CrmOutingStatus)}
                    className={`text-xs border-0 rounded-full px-2 py-1 font-medium capitalize focus:outline-none ${statusColors[outing.status]}`}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2 text-slate-500 capitalize">{outing.assigned_to ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && <p className="text-center text-slate-400 text-sm py-8">No outings yet.</p>}
      </div>
    </div>
  )
}
