'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export default function MemberListFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/admin/users?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <input
        type="search"
        placeholder="Search by name or email…"
        defaultValue={searchParams.get('q') ?? ''}
        onChange={e => update('q', e.target.value)}
        className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4332]/30 w-64"
      />
      <label className="sr-only" htmlFor="filter-tier">Tier</label>
      <select
        id="filter-tier"
        defaultValue={searchParams.get('tier') ?? ''}
        onChange={e => update('tier', e.target.value)}
        className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm focus:outline-none"
      >
        <option value="">All tiers</option>
        <option value="ace">Ace</option>
        <option value="eagle">Eagle</option>
        <option value="fairway">Fairway</option>
      </select>
      <label className="sr-only" htmlFor="filter-status">Status</label>
      <select
        id="filter-status"
        defaultValue={searchParams.get('status') ?? ''}
        onChange={e => update('status', e.target.value)}
        className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm focus:outline-none"
      >
        <option value="">All statuses</option>
        <option value="active">Active</option>
        <option value="canceled">Canceled</option>
        <option value="past_due">Past due</option>
      </select>
      <label className="sr-only" htmlFor="filter-founding">Founding</label>
      <select
        id="filter-founding"
        defaultValue={searchParams.get('founding') ?? ''}
        onChange={e => update('founding', e.target.value)}
        className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm focus:outline-none"
      >
        <option value="">All members</option>
        <option value="true">Founding only</option>
      </select>
    </div>
  )
}
