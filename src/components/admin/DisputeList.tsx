'use client'
import { useState } from 'react'
import DisputeDetailPanel, { type DisputeRow } from '@/components/admin/DisputeDetailPanel'

const TABS = ['All', 'Open', 'Under Review', 'Won', 'Lost'] as const
type Tab = typeof TABS[number]

const STATUS_MAP: Record<Tab, string | null> = {
  All: null,
  Open: 'open',
  'Under Review': 'under_review',
  Won: 'won',
  Lost: 'lost',
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

function deadlineClass(days: number | null): string {
  if (days === null) return 'text-[#6B7770]'
  if (days <= 3) return 'text-red-600 font-semibold'
  if (days <= 10) return 'text-amber-600'
  return 'text-[#6B7770]'
}

interface DisputeListProps {
  disputes: DisputeRow[]
}

export default function DisputeList({ disputes }: DisputeListProps) {
  const [activeTab, setActiveTab] = useState<Tab>('All')
  const [selected, setSelected] = useState<DisputeRow | null>(null)

  const urgent = disputes.filter(d => {
    const days = daysUntil(d.evidence_due_by)
    return days !== null && days <= 3 && d.status === 'open'
  })

  const filtered = activeTab === 'All'
    ? disputes
    : disputes.filter(d => d.status === STATUS_MAP[activeTab])

  const tabCount = (tab: Tab) => tab === 'All'
    ? disputes.length
    : disputes.filter(d => d.status === STATUS_MAP[tab]).length

  return (
    <div className="space-y-4">
      {urgent.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span className="text-base">⏰</span>
          <strong>Urgent:</strong> {urgent.length} open dispute{urgent.length !== 1 ? 's' : ''} with evidence deadline in ≤ 3 days.
        </div>
      )}

      <div className="flex gap-1 border-b border-black/5">
        {TABS.map(tab => (
          <button
            key={tab}
            aria-label={tab === 'Under Review' ? 'In progress disputes' : undefined}
            onClick={() => { setActiveTab(tab); setSelected(null) }}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-[#1B4332] text-[#1B4332]'
                : 'border-transparent text-[#6B7770] hover:text-[#1A1A1A]'
            }`}
          >
            {tab}
            <span className="ml-1.5 text-xs text-[#6B7770]" aria-hidden="true">({tabCount(tab)})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-[#6B7770] py-4">No disputes in this category.</p>
      ) : (
        <div className="bg-white rounded-xl ring-1 ring-black/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#FAF7F2] text-[#6B7770] border-b border-black/5">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Dispute ID</th>
                <th className="text-left px-4 py-3 font-medium">Member</th>
                <th className="text-right px-4 py-3 font-medium">Amount</th>
                <th className="text-left px-4 py-3 font-medium">Reason</th>
                <th className="text-left px-4 py-3 font-medium">Evidence Deadline</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filtered.map(d => {
                const days = daysUntil(d.evidence_due_by)
                return (
                  <tr key={d.id} className={selected?.id === d.id ? 'bg-[#FAF7F2]/60' : 'hover:bg-[#FAF7F2]/40'}>
                    <td className="px-4 py-3 font-mono text-xs text-[#6B7770]">…{d.stripe_dispute_id.slice(-8)}</td>
                    <td className="px-4 py-3">{d.member_name ?? d.member_email ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-medium">${(d.amount_cents / 100).toFixed(2)}</td>
                    <td className="px-4 py-3 capitalize text-[#6B7770]">{d.reason?.replace('_', ' ') ?? '—'}</td>
                    <td className={`px-4 py-3 ${deadlineClass(days)}`}>
                      {d.evidence_due_by
                        ? <>
                            {days !== null && days <= 3 && <span className="mr-1">⏰</span>}
                            {new Date(d.evidence_due_by).toLocaleDateString()}
                            {days !== null && ` (${days}d)`}
                          </>
                        : '—'}
                    </td>
                    <td className="px-4 py-3 capitalize text-[#6B7770]">{d.status.replace('_', ' ')}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelected(selected?.id === d.id ? null : d)}
                        className="rounded border border-black/15 px-2.5 py-1 text-xs font-medium hover:bg-[#FAF7F2] transition-colors"
                      >
                        {selected?.id === d.id ? 'Close' : 'View'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <DisputeDetailPanel dispute={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
