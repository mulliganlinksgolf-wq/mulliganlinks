'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  userId: string
  email: string
  initialName: string
  initialPhone: string
  membership: { tier: string; status: string; current_period_end: string | null } | null
}

const tierLabels: Record<string, string> = { free: 'Fairway', eagle: 'Eagle', ace: 'Ace' }

export function ProfileForm({ userId, email, initialName, initialPhone, membership }: Props) {
  const [fullName, setFullName] = useState(initialName)
  const [phone, setPhone] = useState(initialPhone)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaved(false); setError(null)
    startTransition(async () => {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone })
        .eq('id', userId)
      if (error) setError(error.message)
      else setSaved(true)
    })
  }

  const tier = membership?.tier ?? 'free'

  return (
    <div className="space-y-4">
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-base">Account details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={email} disabled className="bg-gray-50 text-[#6B7770]" />
              <p className="text-xs text-[#6B7770]">Email cannot be changed.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="+1 (555) 000-0000" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {saved && <p className="text-sm text-[#1B4332]">Profile saved.</p>}
            <Button type="submit" disabled={isPending} className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-[#FAF7F2]">
              {isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-base">Membership</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[#6B7770]">Plan</span>
            <span className="font-semibold text-[#1A1A1A]">{tierLabels[tier] ?? 'Fairway'}</span>
          </div>
          {membership?.current_period_end && (
            <div className="flex justify-between">
              <span className="text-[#6B7770]">Renews</span>
              <span className="text-[#1A1A1A]">{new Date(membership.current_period_end).toLocaleDateString()}</span>
            </div>
          )}
          {tier === 'free' && (
            <a href="/signup?tier=eagle" className="inline-block mt-3 px-4 py-2 bg-[#E0A800] text-[#1A1A1A] rounded text-sm font-semibold hover:bg-[#E0A800]/90">
              Upgrade to Eagle
            </a>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
