'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { joinGolferWaitlist } from './actions'

export function GolferWaitlistForm({ tier = '' }: { tier?: string }) {
  const [selectedTier, setSelectedTier] = useState(tier)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState<string | null>(null)
  const [showOptional, setShowOptional] = useState(false)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await joinGolferWaitlist(formData)
      if (result.success) {
        const emailVal = (formData.get('email') as string)?.toLowerCase().trim() ?? ''
        setSubmitted(emailVal)
      } else {
        setError(result.error ?? 'Something went wrong.')
      }
    })
  }

  const selectClassName = "flex h-9 w-full rounded-md border border-white/20 bg-white/10 px-3 py-1 text-sm text-[#F4F1EA] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E0A800] disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-[#F4F1EA]/40"

  if (submitted) {
    return (
      <div className="space-y-6 text-center py-4">
        <p className="text-4xl">✅</p>
        <div className="space-y-2">
          <p className="text-lg font-semibold text-[#F4F1EA]">You&apos;re on the list.</p>
          <p className="text-sm text-[#F4F1EA]/70">We&apos;ll reach out to <span className="font-semibold text-[#F4F1EA]">{submitted}</span> when TeeAhead launches in Metro Detroit.</p>
        </div>
        <div className="space-y-3 text-left bg-white/8 rounded-xl p-5">
          <p className="text-sm font-semibold text-[#F4F1EA]">You&apos;re on the list. Here&apos;s what happens next:</p>
          {[
            "We'll email you when TeeAhead launches in your zip code area.",
            "You'll get early access to lock in founding member pricing before public launch.",
            "No credit card until you're ready to activate.",
          ].map((step, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="flex-shrink-0 size-5 rounded-full bg-[#E0A800] text-[#0a0a0a] text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
              <p className="text-sm text-[#F4F1EA]/75">{step}</p>
            </div>
          ))}
        </div>
        <a href="/#pricing" className="inline-flex items-center justify-center rounded-lg bg-[#E0A800] px-6 py-3 text-sm font-semibold text-[#0a0a0a] hover:bg-[#E0A800]/90 transition-colors">
          Compare memberships →
        </a>
      </div>
    )
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Required fields */}
      <div className="space-y-1.5">
        <Label htmlFor="first_name" className="text-[#F4F1EA]">First name *</Label>
        <Input
          id="first_name"
          name="first_name"
          required
          disabled={isPending}
          placeholder="Jack"
          className="bg-white/10 border-white/20 text-[#F4F1EA] placeholder:text-[#F4F1EA]/40 focus-visible:ring-[#E0A800]"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-[#F4F1EA]">Email address *</Label>
        <Input id="email" name="email" type="email" required disabled={isPending} placeholder="jack@example.com" className="bg-white/10 border-white/20 text-[#F4F1EA] placeholder:text-[#F4F1EA]/40 focus-visible:ring-[#E0A800]" />
        <p className="text-xs text-[#F4F1EA]/50">No spam, ever. We&apos;ll only contact you about your waitlist status and the Metro Detroit launch.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="zip_code" className="text-[#F4F1EA]">ZIP code *</Label>
        <Input
          id="zip_code"
          name="zip_code"
          required
          disabled={isPending}
          placeholder="48009"
          maxLength={10}
          className="bg-white/10 border-white/20 text-[#F4F1EA] placeholder:text-[#F4F1EA]/40 focus-visible:ring-[#E0A800]"
        />
        <p className="text-xs text-[#F4F1EA]/60">We use this to prioritize by metro area.</p>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-[#E0A800] hover:bg-[#E0A800]/90 text-[#0a0a0a] font-bold py-3"
      >
        {isPending ? 'Joining…' : 'Claim My Spot ⛳'}
      </Button>

      {/* Optional accordion */}
      <div className="border border-white/12 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowOptional(!showOptional)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
          aria-expanded={showOptional}
        >
          <span className="text-sm text-[#F4F1EA]/70 font-medium">
            Optional: help us personalize your experience
          </span>
          <span
            className="flex-shrink-0 text-[#F4F1EA]/50 transition-transform duration-200"
            style={{ transform: showOptional ? 'rotate(180deg)' : 'rotate(0deg)' }}
            aria-hidden="true"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>

        <div
          className="overflow-hidden transition-all duration-300"
          style={{ maxHeight: showOptional ? '800px' : '0px' }}
        >
          <div className="px-4 pb-5 space-y-5 border-t border-white/10 pt-4">

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="last_name" className="text-[#F4F1EA]">Last name</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  disabled={isPending}
                  placeholder="Nicklaus"
                  className="bg-white/10 border-white/20 text-[#F4F1EA] placeholder:text-[#F4F1EA]/40 focus-visible:ring-[#E0A800]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="home_course" className="text-[#F4F1EA]">Home course</Label>
              <Input
                id="home_course"
                name="home_course"
                disabled={isPending}
                placeholder="Oakland Hills, Detroit Golf Club, etc."
                className="bg-white/10 border-white/20 text-[#F4F1EA] placeholder:text-[#F4F1EA]/40 focus-visible:ring-[#E0A800]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rounds_per_year" className="text-[#F4F1EA]">Rounds per year</Label>
              <select id="rounds_per_year" name="rounds_per_year" disabled={isPending} className={selectClassName}>
                <option value="">Select…</option>
                <option value="under_10">Under 10</option>
                <option value="10_20">10–20</option>
                <option value="20_40">20–40</option>
                <option value="40_plus">40+</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="current_membership" className="text-[#F4F1EA]">Current membership</Label>
              <select id="current_membership" name="current_membership" disabled={isPending} className={selectClassName}>
                <option value="">Select…</option>
                <option value="none">None</option>
                <option value="golfpass_plus">GolfPass+</option>
                <option value="troon_access">Troon Access</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-[#F4F1EA]">Which tier interests you most?</Label>
              <div className="space-y-2">
                {[
                  { value: 'fairway', label: 'Fairway — Free forever' },
                  { value: 'eagle', label: 'Eagle — $89/yr (most popular)' },
                  { value: 'ace', label: 'Ace — $159/yr (all-in)' },
                  { value: 'not_sure', label: 'Not sure yet' },
                ].map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="interested_tier"
                      value={value}
                      disabled={isPending}
                      checked={selectedTier === value}
                      onChange={() => setSelectedTier(value)}
                      className="accent-[#E0A800]"
                    />
                    <span className="text-sm text-[#F4F1EA]">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="referral_source" className="text-[#F4F1EA]">Where did you hear about us?</Label>
              <Input
                id="referral_source"
                name="referral_source"
                disabled={isPending}
                placeholder="Instagram, friend, golf course, etc."
                className="bg-white/10 border-white/20 text-[#F4F1EA] placeholder:text-[#F4F1EA]/40 focus-visible:ring-[#E0A800]"
              />
            </div>

          </div>
        </div>
      </div>
    </form>
  )
}
