'use client'
import { useRouter, useSearchParams } from 'next/navigation'

const PERIODS = ['7d', '30d', '90d', '1yr'] as const

export default function AnalyticsTimeFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const active = searchParams.get('period') ?? '30d'

  return (
    <div className="flex gap-1 rounded-lg bg-[#FAF7F2] p-1 ring-1 ring-black/5 w-fit">
      {PERIODS.map(p => (
        <button
          key={p}
          onClick={() => router.push(`/admin?period=${p}`)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            active === p
              ? 'bg-white text-[#1A1A1A] shadow-sm ring-1 ring-black/10'
              : 'text-[#6B7770] hover:text-[#1A1A1A]'
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  )
}
