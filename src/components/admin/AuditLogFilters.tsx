'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback } from 'react'

const ACTION_TYPES = [
  { value: '', label: 'All Actions' },
  { value: 'membership_cancelled', label: 'Cancellations & Refunds' },
  { value: 'tier_changed', label: 'Tier Changes' },
  { value: 'content_edited', label: 'Content Edits' },
  { value: 'config_changed', label: 'Config Changes' },
  { value: 'email_sent', label: 'Communications' },
  { value: 'dispute_updated', label: 'Disputes' },
  { value: 'credit_added', label: 'Credits' },
  { value: 'points_adjusted', label: 'Points' },
]

const TIME_RANGES = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
]

export default function AuditLogFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') ?? '')

  const push = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', '1')
      for (const [k, v] of Object.entries(updates)) {
        if (v) params.set(k, v)
        else params.delete(k)
      }
      router.push(`/admin/audit?${params.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <input
        aria-label="Search"
        placeholder="Search by member or admin…"
        value={q}
        onChange={e => {
          setQ(e.target.value)
          push({ q: e.target.value })
        }}
        className="rounded-lg border border-black/15 px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
      />
      <select
        aria-label="Action type"
        defaultValue={searchParams.get('event_type') ?? ''}
        onChange={e => push({ event_type: e.target.value })}
        className="rounded-lg border border-black/15 px-3 py-1.5 text-sm bg-white focus:outline-none"
      >
        {ACTION_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <select
        aria-label="Time range"
        defaultValue={searchParams.get('range') ?? '30d'}
        onChange={e => push({ range: e.target.value })}
        className="rounded-lg border border-black/15 px-3 py-1.5 text-sm bg-white focus:outline-none"
      >
        {TIME_RANGES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}
