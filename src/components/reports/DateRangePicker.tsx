'use client'

import { Suspense } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import type { DatePreset } from '@/lib/reports/dateRange'

const PRESETS: { label: string; value: DatePreset }[] = [
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'This Quarter', value: 'this_quarter' },
  { label: 'YTD', value: 'ytd' },
  { label: 'Custom', value: 'custom' },
]

function DateRangePickerInner() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = (searchParams.get('preset') ?? 'this_month') as DatePreset
  const [showCustom, setShowCustom] = useState(current === 'custom')
  const [customFrom, setCustomFrom] = useState(searchParams.get('from') ?? '')
  const [customTo, setCustomTo] = useState(searchParams.get('to') ?? '')

  function navigate(preset: DatePreset, from?: string, to?: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('preset', preset)
    if (preset === 'custom' && from && to) {
      params.set('from', from)
      params.set('to', to)
    } else {
      params.delete('from')
      params.delete('to')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map(p => (
        <button
          key={p.value}
          onClick={() => {
            setShowCustom(p.value === 'custom')
            if (p.value !== 'custom') navigate(p.value)
          }}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            current === p.value
              ? 'bg-[#1B4332] text-[#FAF7F2] border-[#1B4332]'
              : 'bg-white text-[#6B7770] border-gray-200 hover:border-[#1B4332] hover:text-[#1A1A1A]'
          }`}
        >
          {p.label}
        </button>
      ))}
      {showCustom && (
        <div className="flex items-center gap-2">
          <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]" />
          <span className="text-[#6B7770] text-sm">to</span>
          <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]" />
          <button
            onClick={() => {
              if (customFrom > customTo) return
              navigate('custom', customFrom, customTo)
            }}
            disabled={!customFrom || !customTo || customFrom > customTo}
            className="px-3 py-1.5 bg-[#1B4332] text-[#FAF7F2] rounded-lg text-sm font-medium disabled:opacity-40">
            Apply
          </button>
        </div>
      )}
    </div>
  )
}

export default function DateRangePicker() {
  return (
    <Suspense fallback={<div className="h-9 w-64 bg-gray-100 animate-pulse rounded-lg" />}>
      <DateRangePickerInner />
    </Suspense>
  )
}
