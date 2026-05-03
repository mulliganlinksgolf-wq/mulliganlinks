'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RequestModal } from './RequestModal'
import { RequestConfirmation } from './RequestConfirmation'

interface RequestButtonProps {
  courseId: string
  bookingId: string | null
  teeTime: string // ISO datetime
  serviceRequestsEnabled?: boolean
}

type UIState = 'idle' | 'modal' | 'confirmation'

function isWithinWindow(teeTime: string): boolean {
  const now = Date.now()
  const start = new Date(teeTime).getTime()
  const end = start + 5 * 60 * 60 * 1000 // +5 hours
  return now >= start && now <= end
}

export function RequestButton({ courseId, bookingId, teeTime, serviceRequestsEnabled = true }: RequestButtonProps) {
  const [visible, setVisible] = useState(() => isWithinWindow(teeTime))
  const [uiState, setUiState] = useState<UIState>('idle')
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null)
  const [acknowledged, setAcknowledged] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(isWithinWindow(teeTime))
    }, 60_000)
    return () => clearInterval(interval)
  }, [teeTime])

  // Subscribe to Realtime updates when we have a pending request
  useEffect(() => {
    if (!pendingRequestId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`service_request_${pendingRequestId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'service_requests',
          filter: `id=eq.${pendingRequestId}`,
        },
        (payload) => {
          if (payload.new.status === 'acknowledged') {
            setAcknowledged(true)
            setPendingRequestId(null)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [pendingRequestId])

  if (!visible || !serviceRequestsEnabled) return null

  return (
    <>
      {/* Acknowledgment banner — shown when course responds */}
      {acknowledged && (
        <div className="fixed bottom-24 left-4 right-4 z-50 sm:left-auto sm:right-5 sm:w-80">
          <div
            className="rounded-xl px-5 py-4 shadow-xl flex items-start gap-3"
            style={{ background: '#166534' }}
          >
            <div
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
              style={{ background: '#15803d' }}
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold font-sans text-sm leading-snug">The pro shop is on it.</p>
              <p className="text-[#86efac] font-sans text-xs mt-1">Someone is heading your way.</p>
            </div>
            <button
              onClick={() => setAcknowledged(false)}
              className="text-white/50 hover:text-white/80 text-lg leading-none ml-1 mt-0.5"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {uiState === 'idle' && !acknowledged && (
        <button
          onClick={() => setUiState('modal')}
          className="fixed bottom-6 right-5 z-40 flex items-center gap-2 rounded-full px-5 py-3 text-white font-semibold font-sans text-sm shadow-lg transition-opacity hover:opacity-90 active:opacity-80"
          style={{ background: '#1B4332' }}
        >
          <span className="text-base leading-none">🛎️</span>
          Need something?
        </button>
      )}

      {uiState === 'confirmation' && (
        <div className="fixed bottom-6 right-5 left-5 z-40 sm:left-auto sm:w-80">
          <RequestConfirmation onDismiss={() => setUiState('idle')} />
        </div>
      )}

      {uiState === 'modal' && (
        <RequestModal
          courseId={courseId}
          bookingId={bookingId}
          onClose={() => setUiState('idle')}
          onSubmitted={(requestId: string) => {
            setPendingRequestId(requestId)
            setUiState('confirmation')
          }}
        />
      )}
    </>
  )
}
