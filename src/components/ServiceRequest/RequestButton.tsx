'use client'

import { useState, useEffect } from 'react'
import { RequestModal } from './RequestModal'
import { RequestConfirmation } from './RequestConfirmation'

interface RequestButtonProps {
  courseId: string
  bookingId: string | null
  teeTime: string // ISO datetime
}

type UIState = 'idle' | 'modal' | 'confirmation'

function isWithinWindow(teeTime: string): boolean {
  const now = Date.now()
  const start = new Date(teeTime).getTime()
  const end = start + 5 * 60 * 60 * 1000 // +5 hours
  return now >= start && now <= end
}

export function RequestButton({ courseId, bookingId, teeTime }: RequestButtonProps) {
  const [visible, setVisible] = useState(() => isWithinWindow(teeTime))
  const [uiState, setUiState] = useState<UIState>('idle')

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(isWithinWindow(teeTime))
    }, 60_000)
    return () => clearInterval(interval)
  }, [teeTime])

  if (!visible) return null

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
          onSubmitted={() => setUiState('confirmation')}
        />
      )}
    </>
  )
}
