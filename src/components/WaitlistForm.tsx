'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { joinWaitlist } from '@/app/actions/waitlist'

export function WaitlistForm() {
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setMessage(null)
    startTransition(async () => {
      const result = await joinWaitlist(formData)
      if (result.success) {
        setMessage({ text: "You're on the list. We'll be in touch soon.", success: true })
      } else {
        setMessage({ text: result.error ?? 'Something went wrong.', success: false })
      }
    })
  }

  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-md">
      <form action={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full">
        <Input
          type="email"
          name="email"
          placeholder="your@email.com"
          required
          disabled={isPending}
          className="flex-1 bg-white border-[#1B4332]/20 focus-visible:ring-[#1B4332]"
        />
        <Button
          type="submit"
          disabled={isPending}
          className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-[#FAF7F2] font-semibold px-6"
        >
          {isPending ? 'Joining...' : 'Get Early Access'}
        </Button>
      </form>
      {message && (
        <p className={`text-sm ${message.success ? 'text-[#1B4332]' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
    </div>
  )
}
