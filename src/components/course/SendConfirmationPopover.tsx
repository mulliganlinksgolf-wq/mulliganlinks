'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { sendWalkInConfirmation } from '@/app/actions/teeTime'

interface Props {
  bookingId: string
  guestName: string
  initialEmail?: string
}

export function SendConfirmationPopover({ bookingId, guestName, initialEmail }: Props) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState(initialEmail ?? '')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (open && inputRef.current) {
      const t = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [open])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  function handleSend() {
    if (!email.trim()) {
      setError('Email is required')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await sendWalkInConfirmation({ bookingId, email: email.trim() })
      if (result?.error) {
        setError(result.error)
      } else {
        setSent(true)
        timerRef.current = setTimeout(() => {
          setOpen(false)
          setSent(false)
        }, 1800)
      }
    })
  }

  if (sent) {
    return (
      <span className="text-xs px-2 py-0.5 text-green-700 font-medium">✓ Sent</span>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="text-xs px-2 py-0.5 border border-gray-300 rounded hover:bg-gray-100 text-[#6B7770]"
        title={`Send confirmation to ${guestName}`}
      >
        ✉ Confirm
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-20 bg-white rounded-lg border border-gray-200 shadow-lg p-3 w-64"
          onClick={e => e.stopPropagation()}
        >
          <p className="text-xs font-medium text-[#1A1A1A] mb-2">
            Send confirmation to {guestName}
          </p>
          <input
            ref={inputRef}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="guest@email.com"
            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#1B4332] mb-2"
          />
          {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => setOpen(false)}
              className="flex-1 py-1.5 text-xs text-[#6B7770] border border-gray-200 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={isPending}
              className="flex-1 py-1.5 text-xs bg-[#1B4332] text-[#FAF7F2] rounded hover:bg-[#1B4332]/90 disabled:opacity-50"
            >
              {isPending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
