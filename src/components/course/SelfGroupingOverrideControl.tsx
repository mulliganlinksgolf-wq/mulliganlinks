'use client'

import { useTransition } from 'react'
import { toggleSelfGroupingForDay } from '@/app/actions/course-operations'

export function SelfGroupingOverrideControl({
  courseSlug,
  date,
  isDisabled,
}: {
  courseSlug: string
  date: string
  isDisabled: boolean
}) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
      <div className="flex-1">
        <div className="text-sm font-medium text-[#1A1A1A]">
          Self-grouping {isDisabled ? 'disabled' : 'enabled'} for today
        </div>
        <div className="text-xs text-[#6B7770]">
          {isDisabled
            ? "Solo golfers can't join existing groups today. Useful for tournament or shotgun-start days."
            : 'Solo golfers can join existing partial tee times today.'}
        </div>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            await toggleSelfGroupingForDay({ courseSlug, date })
          })
        }}
        className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
          isDisabled
            ? 'bg-[#1B4332] text-[#FAF7F2] border-[#1B4332] hover:bg-[#143425]'
            : 'bg-white text-[#1B4332] border-[#1B4332] hover:bg-[#F0F4F1]'
        } ${pending ? 'opacity-50 cursor-wait' : ''}`}
      >
        {pending ? 'Saving…' : isDisabled ? 'Re-enable for today' : 'Disable for today'}
      </button>
    </div>
  )
}
