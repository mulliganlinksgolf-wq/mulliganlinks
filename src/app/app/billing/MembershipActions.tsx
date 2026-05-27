'use client'

import { useState, useTransition } from 'react'
import { pauseMembership, resumeMembership, cancelMembership } from '@/lib/actions/membership'

type Screen = 'idle' | 'pause-select' | 'pause-confirm' | 'cancel-confirm'

interface Props {
  tier: string
  isPaused: boolean
  pausedUntil: string | null
  isCancelPending: boolean
}

export default function MembershipActions({ tier, isPaused, pausedUntil, isCancelPending }: Props) {
  const [screen, setScreen] = useState<Screen>('idle')
  const [pauseMonths, setPauseMonths] = useState<1 | 2>(1)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (tier === 'free') return null

  function run(action: () => Promise<void>) {
    setError(null)
    startTransition(async () => {
      try {
        await action()
        setScreen('idle')
      } catch (e: any) {
        setError(e.message ?? 'Something went wrong')
      }
    })
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-500">{error}</p>}

      {screen === 'idle' && (
        <div className="flex flex-wrap gap-3">
          {isPaused ? (
            <button
              onClick={() => run(resumeMembership)}
              disabled={isPending}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[#1B4332] text-white hover:bg-[#163d2a] disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Resuming…' : 'Resume membership'}
            </button>
          ) : !isCancelPending ? (
            <button
              onClick={() => setScreen('pause-select')}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-[#1A1A1A] hover:border-[#1B4332] transition-colors"
            >
              Pause membership
            </button>
          ) : null}

          {!isCancelPending && (
            <button
              onClick={() => setScreen('cancel-confirm')}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
            >
              Cancel membership
            </button>
          )}
        </div>
      )}

      {screen === 'pause-select' && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4 max-w-sm">
          <p className="font-medium text-[#1A1A1A]">How long would you like to pause?</p>
          <p className="text-sm text-[#6B7770]">
            You won't be charged during your pause. Your membership resumes automatically.
          </p>
          <div className="flex gap-3">
            {([1, 2] as const).map(m => (
              <button
                key={m}
                onClick={() => setPauseMonths(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  pauseMonths === m
                    ? 'border-[#1B4332] bg-[#1B4332] text-white'
                    : 'border-gray-200 text-[#1A1A1A] hover:border-[#1B4332]'
                }`}
              >
                {m} month{m > 1 ? 's' : ''}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setScreen('pause-confirm')}
              className="flex-1 py-2 rounded-lg text-sm font-medium bg-[#1B4332] text-white hover:bg-[#163d2a] transition-colors"
            >
              Continue
            </button>
            <button
              onClick={() => setScreen('idle')}
              className="flex-1 py-2 rounded-lg text-sm font-medium border border-gray-200 text-[#6B7770] hover:border-gray-300 transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {screen === 'pause-confirm' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-4 max-w-sm">
          <p className="font-medium text-amber-900">Confirm pause for {pauseMonths} month{pauseMonths > 1 ? 's' : ''}</p>
          <p className="text-sm text-amber-800">
            Your membership will be paused and you won't be charged. It resumes automatically after {pauseMonths} month{pauseMonths > 1 ? 's' : ''}.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => run(() => pauseMembership(pauseMonths))}
              disabled={isPending}
              className="flex-1 py-2 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Pausing…' : 'Confirm pause'}
            </button>
            <button
              onClick={() => setScreen('idle')}
              disabled={isPending}
              className="flex-1 py-2 rounded-lg text-sm font-medium border border-gray-200 text-[#6B7770] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {screen === 'cancel-confirm' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 space-y-4 max-w-sm">
          <p className="font-medium text-red-900">Cancel your membership?</p>
          <p className="text-sm text-red-700">
            Your access continues until the end of your current billing period. This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => run(cancelMembership)}
              disabled={isPending}
              className="flex-1 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Cancelling…' : 'Yes, cancel'}
            </button>
            <button
              onClick={() => setScreen('idle')}
              disabled={isPending}
              className="flex-1 py-2 rounded-lg text-sm font-medium border border-gray-200 text-[#6B7770] transition-colors"
            >
              Keep membership
            </button>
          </div>
        </div>
      )}

      {isPaused && pausedUntil && screen === 'idle' && (
        <p className="text-sm text-amber-700">
          Paused until {new Date(pausedUntil).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
          Auto-resumes after that date.
        </p>
      )}
    </div>
  )
}
