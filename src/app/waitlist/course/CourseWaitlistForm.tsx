'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { joinCourseWaitlist } from './actions'

export function CourseWaitlistForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tier = searchParams.get('tier') ?? 'founding'

  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [onGolfnow, setOnGolfnow] = useState<boolean | null>(null)
  const [avgGreenFee, setAvgGreenFee] = useState<string>('')

  const estimatedBarter =
    onGolfnow && avgGreenFee && !isNaN(parseInt(avgGreenFee, 10))
      ? 2 * parseInt(avgGreenFee, 10) * 300
      : null

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await joinCourseWaitlist(formData)
      if (result.success) {
        router.push('/waitlist/course/confirmed')
      } else {
        setError(result.error ?? 'Something went wrong.')
      }
    })
  }

  const selectClassName = "flex h-9 w-full rounded-md border border-white/20 bg-white/10 px-3 py-1 text-sm text-[#F4F1EA] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E0A800] disabled:cursor-not-allowed disabled:opacity-50"

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Hidden tier field — captures which pricing tier the applicant wants */}
      <input type="hidden" name="applied_tier" value={tier} />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="course_name" className="text-[#F4F1EA]">Course name *</Label>
        <Input id="course_name" name="course_name" required disabled={isPending} placeholder="Oakland Hills Country Club" className="bg-white/10 border-white/20 text-[#F4F1EA] placeholder:text-[#F4F1EA]/40 focus-visible:ring-[#E0A800]" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="contact_name" className="text-[#F4F1EA]">Your name *</Label>
          <Input id="contact_name" name="contact_name" required disabled={isPending} placeholder="Alex Johnson" className="bg-white/10 border-white/20 text-[#F4F1EA] placeholder:text-[#F4F1EA]/40 focus-visible:ring-[#E0A800]" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact_role" className="text-[#F4F1EA]">Your role</Label>
          <select id="contact_role" name="contact_role" disabled={isPending} className={selectClassName}>
            <option value="">Select…</option>
            <option value="owner">Owner</option>
            <option value="gm">General Manager</option>
            <option value="director_of_golf">Director of Golf</option>
            <option value="pro">Head Pro</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-[#F4F1EA]">Email *</Label>
          <Input id="email" name="email" type="email" required disabled={isPending} placeholder="alex@course.com" className="bg-white/10 border-white/20 text-[#F4F1EA] placeholder:text-[#F4F1EA]/40 focus-visible:ring-[#E0A800]" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-[#F4F1EA]">Phone</Label>
          <Input id="phone" name="phone" type="tel" disabled={isPending} placeholder="(248) 555-0100" className="bg-white/10 border-white/20 text-[#F4F1EA] placeholder:text-[#F4F1EA]/40 focus-visible:ring-[#E0A800]" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="city" className="text-[#F4F1EA]">City</Label>
          <Input id="city" name="city" disabled={isPending} placeholder="Birmingham" className="bg-white/10 border-white/20 text-[#F4F1EA] placeholder:text-[#F4F1EA]/40 focus-visible:ring-[#E0A800]" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="state" className="text-[#F4F1EA]">State</Label>
          <Input id="state" name="state" disabled={isPending} placeholder="MI" maxLength={2} className="bg-white/10 border-white/20 text-[#F4F1EA] placeholder:text-[#F4F1EA]/40 focus-visible:ring-[#E0A800]" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="num_holes" className="text-[#F4F1EA]">Number of holes</Label>
          <select id="num_holes" name="num_holes" disabled={isPending} className={selectClassName}>
            <option value="">Select…</option>
            <option value="9">9</option>
            <option value="18">18</option>
            <option value="27">27</option>
            <option value="36">36</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="annual_rounds" className="text-[#F4F1EA]">Est. annual rounds</Label>
          <Input id="annual_rounds" name="annual_rounds" type="number" min="0" disabled={isPending} placeholder="15000" className="bg-white/10 border-white/20 text-[#F4F1EA] placeholder:text-[#F4F1EA]/40 focus-visible:ring-[#E0A800]" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="current_software" className="text-[#F4F1EA]">Current tee sheet software</Label>
        <select id="current_software" name="current_software" disabled={isPending} className={selectClassName}>
          <option value="">Select…</option>
          <option value="golfnow">GolfNow</option>
          <option value="foreup">foreUP</option>
          <option value="lightspeed">Lightspeed</option>
          <option value="club_prophet">Club Prophet</option>
          <option value="other">Other</option>
          <option value="none">None</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contract_expiry_date" className="text-[#F4F1EA]">
          GolfNow contract expiry date{' '}
          <span className="text-[#F4F1EA]/60 font-normal">(optional)</span>
        </Label>
        <Input
          id="contract_expiry_date"
          name="contract_expiry_date"
          type="date"
          disabled={isPending}
          className="bg-white/10 border-white/20 text-[#F4F1EA] placeholder:text-[#F4F1EA]/40 focus-visible:ring-[#E0A800]"
        />
      </div>

      <div className="space-y-3 bg-white/8 rounded-xl p-4 ring-1 ring-white/15">
        <Label className="text-[#F4F1EA]">Are you currently on GolfNow?</Label>
        <div className="flex gap-6">
          {[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ].map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="on_golfnow"
                value={value}
                disabled={isPending}
                onChange={() => setOnGolfnow(value === 'yes')}
                className="accent-[#E0A800]"
              />
              <span className="text-sm text-[#F4F1EA]">{label}</span>
            </label>
          ))}
        </div>

        {onGolfnow && (
          <div className="space-y-2 pt-2">
            <Label htmlFor="avg_green_fee" className="text-[#F4F1EA]">Average green fee (rack rate, $)</Label>
            <Input
              id="avg_green_fee"
              name="avg_green_fee"
              type="number"
              min="0"
              disabled={isPending}
              placeholder="175"
              value={avgGreenFee}
              onChange={(e) => setAvgGreenFee(e.target.value)}
              className="bg-white/10 border-white/20 text-[#F4F1EA] placeholder:text-[#F4F1EA]/40 focus-visible:ring-[#E0A800]"
            />
            {estimatedBarter && (
              <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-sm">
                <p className="font-semibold text-red-700">
                  Estimated annual barter cost: ${estimatedBarter.toLocaleString()}
                </p>
                <p className="text-red-600 text-xs mt-1">
                  (2 tee times/day × ${avgGreenFee} rack rate × 300 operating days)
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="biggest_frustration" className="text-[#F4F1EA]">
          What&apos;s your biggest frustration with your current setup?{' '}
          <span className="text-[#F4F1EA]/60 font-normal">(optional)</span>
        </Label>
        <textarea
          id="biggest_frustration"
          name="biggest_frustration"
          disabled={isPending}
          rows={3}
          placeholder="Barter costs, lack of customer data, booking fees eating into revenue…"
          className="flex min-h-[80px] w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-[#F4F1EA] placeholder:text-[#F4F1EA]/40 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E0A800] disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-[#0F3D2E] hover:bg-[#0F3D2E]/90 text-[#FAF7F2] font-bold py-3 rounded-lg"
      >
        {isPending ? 'Submitting…' : 'Reserve My Founding Partner Spot →'}
      </Button>

      <p className="text-xs text-center text-[#F4F1EA]/50">
        Founding Partner status is subject to review. We&apos;ll be in touch within 48 hours.
      </p>
    </form>
  )
}
