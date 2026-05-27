'use client'

import { useEffect } from 'react'

interface RequestConfirmationProps {
  onDismiss: () => void
}

export function RequestConfirmation({ onDismiss }: RequestConfirmationProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      className="rounded-xl px-5 py-4 cursor-pointer select-none"
      style={{ background: '#166534' }}
      onClick={onDismiss}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
          style={{ background: '#15803d' }}
        >
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-white font-semibold font-sans text-sm leading-snug">
            Got it — the pro shop has been notified.
          </p>
          <p className="text-[#86efac] font-sans text-xs mt-1">
            You'll get a notification when they're on it.
          </p>
        </div>
      </div>
    </div>
  )
}
