'use client'

import { useState } from 'react'
import { PartnerCard } from '@/components/PartnerCard'
import { PartnerRequestModal } from '@/components/PartnerRequestModal'
import type { PartnerAvailability } from '@/types/partners'

interface BrowseFeedProps {
  grouped: { dateLabel: string; date: string; items: PartnerAvailability[] }[]
  canRequest: boolean
  sentToAvailabilityIds: string[]
}

export function BrowseFeed({ grouped, canRequest, sentToAvailabilityIds }: BrowseFeedProps) {
  const [activeAvailability, setActiveAvailability] = useState<PartnerAvailability | null>(null)
  const [sentIds, setSentIds] = useState<Set<string>>(new Set(sentToAvailabilityIds))

  if (grouped.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-[#8FA889] text-lg">No one's posted availability for the next two weeks.</p>
        <p className="text-[#8FA889] text-sm mt-1">Be the first — add your availability.</p>
        <a
          href="/app/partners/my-availability"
          className="inline-block mt-4 bg-white text-[#1B4332] font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-[#FAF7F2]"
        >
          Add my availability
        </a>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-8">
        {grouped.map(group => (
          <div key={group.date}>
            <h2 className="text-lg font-semibold text-white mb-3">{group.dateLabel}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map(av => (
                <PartnerCard
                  key={av.id}
                  availability={av}
                  canRequest={canRequest}
                  alreadyRequested={sentIds.has(av.id)}
                  onRequestClick={a => setActiveAvailability(a)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {activeAvailability && (
        <PartnerRequestModal
          availability={activeAvailability}
          onClose={() => setActiveAvailability(null)}
          onSent={() => {
            setSentIds(prev => new Set([...prev, activeAvailability.id]))
            setActiveAvailability(null)
          }}
        />
      )}
    </>
  )
}
