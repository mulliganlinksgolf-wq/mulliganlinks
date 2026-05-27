'use client'

import { Card } from '@/components/ui/card'
import { SERVICE_REQUEST_CATEGORIES } from '@/lib/serviceRequestCategories'
import { AcknowledgeButton } from './AcknowledgeButton'

interface RequestCardProps {
  id: string
  golfer_name: string | null
  category: string
  note: string | null
  estimated_hole: number | null
  created_at: string
  status: 'open' | 'acknowledged' | 'resolved'
  acknowledged_at: string | null
  onAcknowledged?: (id: string) => void
}

function minutesAgo(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 60_000)
  if (diff < 1) return 'just now'
  if (diff === 1) return '1 min ago'
  return `${diff} min ago`
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export function RequestCard({
  id,
  golfer_name,
  category,
  note,
  estimated_hole,
  created_at,
  status,
  acknowledged_at,
  onAcknowledged,
}: RequestCardProps) {
  const cat = SERVICE_REQUEST_CATEGORIES.find((c) => c.value === category)
  const categoryLabel = cat?.label ?? category
  const categoryIcon = cat?.icon ?? '💬'

  const isOpen = status === 'open'

  return (
    <Card
      className={[
        'p-3 border-l-4 rounded-md',
        isOpen ? 'border-l-[#1B4332]' : 'border-l-gray-300 opacity-60',
      ].join(' ')}
    >
      {/* Row 1: name + time */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-sm font-bold text-[#1A1A1A] truncate">
          {golfer_name ?? 'Unknown golfer'}
        </span>
        <span className="text-xs text-[#6B7770] shrink-0">{minutesAgo(created_at)}</span>
      </div>

      {/* Row 2: category + hole */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs text-[#1A1A1A]">
          {categoryIcon} {categoryLabel}
        </span>
        <span className="text-xs text-[#6B7770]">·</span>
        <span className="text-xs text-[#6B7770]">
          {estimated_hole != null ? `Est. hole ${estimated_hole}` : 'Hole unknown'}
        </span>
      </div>

      {/* Row 3: note (optional) */}
      {note && (
        <p className="text-xs text-[#6B7770] line-clamp-1 mb-2">{note}</p>
      )}

      {/* Row 4: action */}
      <div className="mt-1.5">
        {isOpen ? (
          <AcknowledgeButton
            requestId={id}
            onAcknowledged={() => onAcknowledged?.(id)}
          />
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-[#6B7770]">
            ✓ Acknowledged at {acknowledged_at ? formatTime(acknowledged_at) : '—'}
          </span>
        )}
      </div>
    </Card>
  )
}
