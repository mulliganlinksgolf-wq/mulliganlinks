'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { CrmMember, CrmMemberTier, CrmMemberStatus } from '@/lib/crm/types'

const tierColors: Record<CrmMemberTier, string> = {
  free: 'bg-slate-100 text-slate-600',
  eagle: 'bg-blue-100 text-blue-700',
  ace: 'bg-amber-100 text-amber-700',
}

const statusColors: Record<CrmMemberStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  lapsed: 'bg-amber-100 text-amber-700',
  churned: 'bg-red-100 text-red-500',
}

interface Props {
  initialMembers: CrmMember[]
  onExportCsv: () => void
}

export function MemberTable({ initialMembers, onExportCsv }: Props) {
  const [tierFilter, setTierFilter] = useState<CrmMemberTier | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<CrmMemberStatus | 'all'>('all')

  const filtered = initialMembers.filter((m) => {
    if (tierFilter !== 'all' && m.membership_tier !== tierFilter) return false
    if (statusFilter !== 'all' && m.status !== statusFilter) return false
    return true
  })

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value as CrmMemberTier | 'all')}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none"
        >
          <option value="all">All Tiers</option>
          <option value="free">Free</option>
          <option value="eagle">Eagle</option>
          <option value="ace">Ace</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as CrmMemberStatus | 'all')}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="lapsed">Lapsed</option>
          <option value="churned">Churned</option>
        </select>
        <span className="text-xs text-slate-400 ml-1">{filtered.length} members</span>
        <button onClick={onExportCsv} className="ml-auto text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded px-3 py-1">
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">Name</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">Email</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">Tier</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">Status</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">Home Course</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">Join Date</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">Lifetime $</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((member) => (
              <tr key={member.id} className="hover:bg-slate-50">
                <td className="px-3 py-2">
                  <Link href={`/admin/crm/members/${member.id}`} className="font-medium text-slate-800 hover:text-emerald-700">
                    {member.name}
                  </Link>
                </td>
                <td className="px-3 py-2 text-slate-600">{member.email ?? '—'}</td>
                <td className="px-3 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${tierColors[member.membership_tier]}`}>
                    {member.membership_tier}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[member.status]}`}>
                    {member.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-slate-600">{member.home_course ?? '—'}</td>
                <td className="px-3 py-2 text-slate-500">
                  {member.join_date ? new Date(member.join_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </td>
                <td className="px-3 py-2 text-slate-600">
                  {member.lifetime_spend > 0 ? `$${member.lifetime_spend.toLocaleString()}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-slate-400 text-sm py-8">No members match the filter.</p>}
      </div>
    </div>
  )
}
