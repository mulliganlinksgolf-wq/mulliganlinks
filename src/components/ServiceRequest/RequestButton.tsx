'use client'

import { useState, useEffect, useRef } from 'react'
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
  const [proShopOnIt, setProShopOnIt] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(isWithinWindow(teeTime))
    }, 60_000)
    return () => clearInterval(interval)
  }, [teeTime])

  // Poll for acknowledgment when we have a pending request ID
  useEffect(() => {
    if (!pendingRequestId) return

    async function checkStatus() {
      try {
        const res = await fetch(`/api/service-requests/${pendingRequestId}/status`)
        if (!res.ok) return
        const data = await res.json() as { status: string }
        if (data.status === 'acknowledged') {
          setProShopOnIt(true)
          setPendingRequestId(null)
          if (pollRef.current) {
            clearInterval(pollRef.current)
            pollRef.current = null
          }
        }
      } catch {
        // Ignore network errors — will retry next interval
      }
    }

    pollRef.current = setInterval(checkStatus, 10_000)
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [pendingRequestId])

  if (!visible || !serviceRequestsEnabled) return null

  return (
    <>
      {uiState === 'idle' && (
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

      {pendingRequestId && proShopOnIt && (
        <div className="fixed bottom-24 left-4 right-4 bg-[#1B4332] text-white px-4 py-3 rounded-lg flex items-center gap-2 shadow-lg z-50">
          <span>✓ The pro shop is on it.</span>
          <button onClick={() => { setProShopOnIt(false); setPendingRequestId(null) }} className="ml-auto text-white/70">✕</button>
        </div>
      )}
    </>
  )
}
