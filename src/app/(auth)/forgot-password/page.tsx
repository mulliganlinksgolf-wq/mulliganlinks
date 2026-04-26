'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      setDone(true)
    })
  }

  if (done) {
    return (
      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="pt-8 pb-8 text-center space-y-3">
          <div className="text-4xl">📬</div>
          <h2 className="text-xl font-bold text-[#1A1A1A]">Check your email</h2>
          <p className="text-[#6B7770] text-sm">We sent a password reset link to <strong>{email}</strong>.</p>
          <Link href="/login" className="block text-sm text-[#1B4332] font-medium hover:underline mt-2">Back to sign in</Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-[#1A1A1A]">Reset your password</CardTitle>
        <CardDescription className="text-[#6B7770]">Enter your email and we&apos;ll send a reset link.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <Button type="submit" disabled={isPending} className="w-full bg-[#1B4332] hover:bg-[#1B4332]/90 text-[#FAF7F2]">
            {isPending ? 'Sending...' : 'Send reset link'}
          </Button>
        </form>
        <p className="text-center text-sm text-[#6B7770] mt-4">
          <Link href="/login" className="text-[#1B4332] font-medium hover:underline">Back to sign in</Link>
        </p>
      </CardContent>
    </Card>
  )
}
