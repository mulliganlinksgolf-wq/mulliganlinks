'use client'

import { useState, useTransition } from 'react'
import { resendInvite } from '@/lib/actions/courseTeam'

export default function ResendInviteButton({
  email,
  courseId,
  slug,
}: {
  email: string
  courseId: string
  slug: string
}) {
  const [sent, setSent] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleResend() {
    startTransition(async () => {
      await resendInvite(email, courseId, slug)
      setSent(true)
      setTimeout(() => setSent(false), 4000)
    })
  }

  if (sent) return <span className="text-xs text-emerald-600 font-medium">✓ Sent</span>

  return (
    <button
      onClick={handleResend}
      disabled={pending}
      className="text-xs text-[#1B4332] hover:underline disabled:opacity-50 font-medium"
    >
      {pending ? 'Sending…' : 'Resend invite'}
    </button>
  )
}
