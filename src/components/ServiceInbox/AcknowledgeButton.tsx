'use client'

import { useState } from 'react'
import { CheckCircle } from 'lucide-react'

interface AcknowledgeButtonProps {
  requestId: string
  onAcknowledged: () => void
}

export function AcknowledgeButton({ requestId, onAcknowledged }: AcknowledgeButtonProps) {
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(false)

  async function handleClick() {
    if (pending || done) return
    setPending(true)
    setError(false)
    try {
      const res = await fetch(`/api/service-requests/${requestId}/acknowledge`, {
        method: 'PATCH',
      })
      if (!res.ok) throw new Error('Request failed')
      setDone(true)
      onAcknowledged()
    } catch {
      setError(true)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={pending || done}
        className={[
          'inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded transition-colors',
          done
            ? 'bg-gray-100 text-gray-400 cursor-default'
            : 'bg-[#1B4332] text-white hover:bg-[#1B4332]/90 disabled:opacity-60 disabled:cursor-not-allowed',
        ].join(' ')}
      >
        {done ? (
          <>
            <CheckCircle size={13} />
            Done
          </>
        ) : pending ? (
          <>
            <span className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ...
          </>
        ) : (
          <>
            <CheckCircle size={13} />
            On it
          </>
        )}
      </button>
      {error && (
        <span className="text-xs text-red-500">Couldn't acknowledge — try again</span>
      )}
    </div>
  )
}
