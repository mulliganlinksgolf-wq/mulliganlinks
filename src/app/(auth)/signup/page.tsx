'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Fire-and-forget admin notification — don't await, never block signup
      fetch('/api/auth/signup-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName }),
      }).catch(() => {}) // Swallow errors silently
      setDone(true)
    }
  }

  if (done) {
    return (
      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="pt-8 pb-8 text-center space-y-3">
          <div className="text-4xl">⛳️</div>
          <h2 className="text-xl font-bold text-[#1A1A1A]">Check your email</h2>
          <p className="text-[#6B7770] text-sm">We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-[#1A1A1A]">Create your account</CardTitle>
        <CardDescription className="text-[#6B7770]">Start with Fairway — free forever. Upgrade anytime.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Jordan Smith" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="At least 8 characters" minLength={8} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full bg-[#1B4332] hover:bg-[#1B4332]/90 text-[#FAF7F2]">
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>
        <p className="text-center text-sm text-[#6B7770] mt-4">
          Already have an account? <Link href="/login" className="text-[#1B4332] font-medium hover:underline">Sign in</Link>
        </p>
        <p className="text-center text-xs text-[#6B7770] mt-3">
          By signing up, you agree to our <Link href="/terms" className="hover:underline">Terms</Link> and <Link href="/privacy" className="hover:underline">Privacy Policy</Link>.
        </p>
      </CardContent>
    </Card>
  )
}
