'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const supabase = createClient()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setError(null)
    startTransition(async () => {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) setError(error.message)
      else router.push('/app')
    })
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="text-[#1B4332] font-bold text-2xl tracking-wide lowercase">teeahead</a>
        </div>
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#1A1A1A]">Set new password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>New password</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} placeholder="At least 8 characters" />
              </div>
              <div className="space-y-1.5">
                <Label>Confirm password</Label>
                <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="Same as above" />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={isPending} className="w-full bg-[#1B4332] hover:bg-[#1B4332]/90 text-[#FAF7F2]">
                {isPending ? 'Updating...' : 'Set new password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
