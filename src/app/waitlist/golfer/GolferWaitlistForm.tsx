'use client'

import { useRef, useState, useTransition } from 'react'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { trackWaitlist } from '@/lib/waitlist-tracking'
import { CoursePreferenceForm } from './CoursePreferenceForm'
import { joinGolferWaitlist } from './actions'

export function GolferWaitlistForm({ tier = 'fairway' }: { tier?: string }) {
  const { executeRecaptcha } = useGoogleReCaptcha()
  const [email, setEmail] = useState('')
  const [zip, setZip] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [courseToken, setCourseToken] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const started = useRef(false)
  const submitting = useRef(false)

  function markStarted() {
    if (!started.current) {
      started.current = true
      trackWaitlist('golfer_waitlist_started')
    }
  }

  function handleSubmit(formData: FormData) {
    if (submitting.current) return
    submitting.current = true
    markStarted()
    setError(null)
    trackWaitlist('golfer_waitlist_submitted')
    startTransition(async () => {
      let stage = 'security_check'
      try {
        if (!executeRecaptcha) {
          setError('Security check is still loading. Please try again in a moment.')
          trackWaitlist('golfer_waitlist_failed', 'security_loading')
          return
        }
        formData.set('recaptcha_token', await executeRecaptcha('golfer_waitlist'))
        stage = 'request'
        const result = await joinGolferWaitlist(formData)
        if (result.success) {
          setCourseToken(result.coursePreferenceToken ?? null)
          setSubmitted(true)
          trackWaitlist(result.alreadyJoined ? 'golfer_waitlist_already_joined' : 'golfer_waitlist_succeeded')
        } else {
          setError(result.error ?? 'Something went wrong. Please try again.')
          trackWaitlist('golfer_waitlist_failed', result.reason ?? 'server')
        }
      } catch {
        setError('We couldn’t complete your request. Please try again. Your details are still here.')
        trackWaitlist('golfer_waitlist_failed', stage)
      } finally {
        submitting.current = false
      }
    })
  }

  if (submitted) {
    return (
      <div className="space-y-4 py-3">
        <div role="status" className="space-y-4">
        <h3 className="text-xl font-semibold">You’re on the list.</h3>
        <p className="text-white/85">We’ll email {email} with news about the Metro Detroit launch. No payment or membership commitment is needed.</p>
        <p className="text-sm text-white/80">We’ll share participating courses and launch timing when they’re confirmed.</p>
        </div>
        {courseToken ? <CoursePreferenceForm token={courseToken} /> : <p className="text-sm text-white/80">Have a favorite course? Reply to your confirmation email and tell us where you play.</p>}
      </div>
    )
  }

  return (
    <form action={handleSubmit} onChange={markStarted} onInvalidCapture={() => {
      markStarted()
      trackWaitlist('golfer_waitlist_failed', 'validation')
    }} aria-busy={isPending} className="space-y-5">
      <input type="hidden" name="interested_tier" value={tier} />
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required maxLength={255} value={email} onChange={e => setEmail(e.target.value)} disabled={isPending} placeholder="you@example.com" className="h-12 bg-white text-[#0F3D2E] text-base" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="zip_code">ZIP code</Label>
        <Input id="zip_code" name="zip_code" autoComplete="postal-code" inputMode="numeric" pattern="[0-9]{5}(-[0-9]{4})?" title="Enter a five-digit ZIP code, such as 48009." required maxLength={10} value={zip} onChange={e => setZip(e.target.value)} disabled={isPending} placeholder="48009" aria-describedby="zip-help" className="h-12 bg-white text-[#0F3D2E] text-base" />
        <p id="zip-help" className="text-xs text-white/80">So we can share launch updates for your area.</p>
      </div>
      <Button type="submit" disabled={isPending} className="h-12 w-full bg-[#E0A800] text-[#082419] hover:bg-[#E0A800]/90 font-semibold text-base">{isPending ? 'Joining…' : 'Notify me at launch'}</Button>
      <p className="text-xs text-white/80">We’ll only email you about TeeAhead and the launch. Unsubscribe anytime.</p>
    </form>
  )
}
