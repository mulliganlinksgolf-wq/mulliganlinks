'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { joinGolferWaitlist } from './actions'

export function GolferWaitlistForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await joinGolferWaitlist(formData)
      if (result.success) {
        router.push(`/waitlist/golfer/confirmed?position=${result.position}`)
      } else {
        setError(result.error ?? 'Something went wrong.')
      }
    })
  }

  const selectClassName = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="first_name">First name *</Label>
          <Input id="first_name" name="first_name" required disabled={isPending} placeholder="Jack" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="last_name">Last name *</Label>
          <Input id="last_name" name="last_name" required disabled={isPending} placeholder="Nicklaus" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email address *</Label>
        <Input id="email" name="email" type="email" required disabled={isPending} placeholder="jack@example.com" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="zip_code">ZIP code *</Label>
        <Input id="zip_code" name="zip_code" required disabled={isPending} placeholder="48009" maxLength={10} />
        <p className="text-xs text-[#6B7770]">We use this to prioritize by metro area.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="home_course">Home course <span className="text-[#6B7770] font-normal">(optional)</span></Label>
        <Input id="home_course" name="home_course" disabled={isPending} placeholder="Oakland Hills, Detroit Golf Club, etc." />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rounds_per_year">Rounds per year</Label>
        <select id="rounds_per_year" name="rounds_per_year" disabled={isPending} className={selectClassName}>
          <option value="">Select…</option>
          <option value="under_10">Under 10</option>
          <option value="10_20">10–20</option>
          <option value="20_40">20–40</option>
          <option value="40_plus">40+</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="current_membership">Current membership</Label>
        <select id="current_membership" name="current_membership" disabled={isPending} className={selectClassName}>
          <option value="">Select…</option>
          <option value="none">None</option>
          <option value="golfpass_plus">GolfPass+</option>
          <option value="troon_access">Troon Access</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label>Which tier interests you most?</Label>
        <div className="space-y-2">
          {[
            { value: 'fairway', label: 'Fairway — Free forever' },
            { value: 'eagle', label: 'Eagle — $79/yr (most popular)' },
            { value: 'ace', label: 'Ace — $149/yr (all-in)' },
            { value: 'not_sure', label: 'Not sure yet' },
          ].map(({ value, label }) => (
            <label key={value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="interested_tier"
                value={value}
                disabled={isPending}
                className="accent-[#1B4332]"
              />
              <span className="text-sm text-[#1A1A1A]">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="referral_source">
          Where did you hear about us?{' '}
          <span className="text-[#6B7770] font-normal">(optional)</span>
        </Label>
        <Input id="referral_source" name="referral_source" disabled={isPending} placeholder="Instagram, friend, golf course, etc." />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-[#1B4332] hover:bg-[#1B4332]/90 text-[#FAF7F2] font-semibold py-3"
      >
        {isPending ? 'Joining…' : 'Claim My Spot ⛳'}
      </Button>

      <p className="text-xs text-center text-[#6B7770]">
        No spam, ever. We&apos;ll only contact you about your waitlist status and the launch.
      </p>
    </form>
  )
}
