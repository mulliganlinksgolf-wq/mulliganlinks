'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { approveFoundingPartner, rejectCourseApplication, sendBarterReceiptAction } from './actions'

export function ApproveButton({
  courseId,
  spotsRemaining,
}: {
  courseId: number
  spotsRemaining: number
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleApprove() {
    if (!confirm('Approve this course as a Founding Partner? This sends them a confirmation email.')) return
    setError(null)
    startTransition(async () => {
      const result = await approveFoundingPartner(courseId)
      if (result.success) {
        router.refresh()
      } else {
        setError(result.error ?? 'Failed to approve.')
      }
    })
  }

  function handleReject() {
    if (!confirm('Mark this application as rejected?')) return
    setError(null)
    startTransition(async () => {
      const result = await rejectCourseApplication(courseId)
      if (result.success) {
        router.refresh()
      } else {
        setError(result.error ?? 'Failed to reject.')
      }
    })
  }

  return (
    <div className="flex flex-col gap-1.5 min-w-[120px]">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        onClick={handleApprove}
        disabled={isPending || spotsRemaining <= 0}
        className="text-xs px-3 py-1.5 rounded-lg bg-[#1B4332] text-[#FAF7F2] font-medium hover:bg-[#1B4332]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'Approving…' : spotsRemaining <= 0 ? 'Cap reached' : '✓ Approve FP'}
      </button>
      <button
        onClick={handleReject}
        disabled={isPending}
        className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
      >
        Reject
      </button>
    </div>
  )
}

export function BarterReceiptButton({ courseId }: { courseId: number }) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'sent' | 'error'>('idle')
  const [, startTransition] = useTransition()

  function handleSend() {
    if (!confirm('Send this Founding Partner their Barter Receipt email?')) return
    setStatus('pending')
    startTransition(async () => {
      const result = await sendBarterReceiptAction(courseId)
      setStatus(result.success ? 'sent' : 'error')
    })
  }

  return (
    <button
      onClick={handleSend}
      disabled={status === 'pending' || status === 'sent'}
      className="text-xs px-3 py-1.5 rounded-lg border border-[#E0A800]/50 text-[#8B6F00] hover:bg-[#E0A800]/10 disabled:opacity-50 transition-colors"
    >
      {status === 'pending' ? 'Sending…' : status === 'sent' ? '✓ Sent' : status === 'error' ? 'Error' : '📊 Barter Receipt'}
    </button>
  )
}
