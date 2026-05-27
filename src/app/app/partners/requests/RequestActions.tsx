'use client'

import { useTransition } from 'react'
import { respondToRequest, withdrawRequest } from '../actions'

export function RespondButtons({ requestId }: { requestId: string }) {
  const [isPending, startTransition] = useTransition()
  return (
    <div className="flex gap-2">
      <button
        disabled={isPending}
        onClick={() => startTransition(async () => {
          await respondToRequest(requestId, 'accepted')
        })}
        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-[#1B4332] hover:bg-[#FAF7F2] disabled:opacity-50"
      >
        Accept
      </button>
      <button
        disabled={isPending}
        onClick={() => startTransition(async () => {
          await respondToRequest(requestId, 'declined')
        })}
        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/10 text-[#8FA889] hover:bg-white/20 disabled:opacity-50"
      >
        Decline
      </button>
    </div>
  )
}

export function WithdrawButton({ requestId }: { requestId: string }) {
  const [isPending, startTransition] = useTransition()
  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(async () => {
        await withdrawRequest(requestId)
      })}
      className="text-sm text-[#8FA889] hover:text-white disabled:opacity-50"
    >
      {isPending ? '…' : 'Withdraw'}
    </button>
  )
}
