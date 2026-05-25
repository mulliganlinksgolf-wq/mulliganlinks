'use client'

import { useState, useTransition } from 'react'
import { Switch } from '@/components/ui/switch'
import { toggleSplitTeeDay } from '@/app/course/[slug]/actions'

export function SplitTeeToggle({
  slug,
  date,
  initialValue,
  canEdit,
}: {
  slug: string
  date: string
  initialValue: boolean
  canEdit: boolean
}) {
  const [enabled, setEnabled] = useState(initialValue)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (!canEdit) {
    return enabled ? (
      <span className="text-xs font-mono uppercase tracking-[0.12em] text-[#E0A800]">
        Split tee day
      </span>
    ) : null
  }

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={enabled}
        disabled={isPending}
        onCheckedChange={(next: boolean) => {
          startTransition(async () => {
            setError(null)
            const previous = enabled
            setEnabled(next)
            const result = await toggleSplitTeeDay(slug, date, next)
            if (!result.ok) {
              setEnabled(previous)
              setError(result.error)
            }
          })
        }}
      />
      <span className="text-xs font-medium text-[#1A1A1A]">Split tee day</span>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
