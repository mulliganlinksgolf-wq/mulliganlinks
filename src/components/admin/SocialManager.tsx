'use client'

import { useState, useCallback } from 'react'
import type { BufferChannel, BufferPost } from '@/lib/buffer'
import SocialComposer from '@/components/admin/social/SocialComposer'
import SocialQueue from '@/components/admin/social/SocialQueue'
import SocialIdeasPanel from '@/components/admin/social/SocialIdeasPanel'

type Props = {
  channels: BufferChannel[]
  scheduledPosts: BufferPost[]
  sentPosts: BufferPost[]
}

export default function SocialManager({ channels, scheduledPosts, sentPosts }: Props) {
  const [fillSaturdaySlot, setFillSaturdaySlot] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const handleToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }, [])

  const handleFillSaturdaySlot = useCallback(() => {
    setFillSaturdaySlot(true)
  }, [])

  const handleFillHandled = useCallback(() => {
    setFillSaturdaySlot(false)
  }, [])

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#1B4332] text-white text-sm px-4 py-2.5 rounded-lg shadow-lg z-50 max-w-xs">
          {toast}
        </div>
      )}

      {/* 3-column grid: composer / queue / ideas */}
      <div className="grid grid-cols-1 lg:grid-cols-[30%_40%_30%] gap-5 items-start">
        <SocialComposer
          channels={channels}
          fillSaturdaySlot={fillSaturdaySlot}
          onFillHandled={handleFillHandled}
          onToast={handleToast}
        />
        <SocialQueue
          scheduledPosts={scheduledPosts}
          onFillSaturdaySlot={handleFillSaturdaySlot}
        />
        <SocialIdeasPanel sentPosts={sentPosts} />
      </div>
    </div>
  )
}
