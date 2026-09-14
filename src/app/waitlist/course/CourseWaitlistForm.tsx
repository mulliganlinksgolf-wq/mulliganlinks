'use client'

import { useRef, useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { joinCourseWaitlist } from './actions'

export function CourseWaitlistForm() {
  const { executeRecaptcha } = useGoogleReCaptcha()
  const searchParams = useSearchParams()
  const [values, setValues] = useState({ course_name: '', contact_name: '', email: '' })
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [pending, startTransition] = useTransition()
  const submitting = useRef(false)

  function submit(data: FormData) {
    if (submitting.current) return
    submitting.current = true
    setError(null)
    startTransition(async () => {
      try {
        if (!executeRecaptcha) {
          setError('Security check is still loading. Please try again in a moment.')
          return
        }
        data.set('recaptcha_token', await executeRecaptcha('course_waitlist'))
        const result = await joinCourseWaitlist(data)
        if (result.success) setSubmitted(true)
        else setError(result.error ?? 'Please try again.')
      } catch {
        setError('We couldn’t send your request. Please try again. Your details are still here.')
      } finally { submitting.current = false }
    })
  }

  if (submitted) return (
    <div role="status" className="space-y-4 text-[#F4F1EA]">
      <h2 className="text-2xl font-semibold">Thanks for the introduction.</h2>
      <p>Neil or Billy will follow up at {values.email} to learn about your course and discuss next steps.</p>
      <p className="text-sm text-white/80">No reservation, contract, or payment has been made.</p>
      <a href="https://scheduler.zoom.us/neil-barris-yro2rr/30-mins-with-teeahead" target="_blank" rel="noopener noreferrer" className="inline-flex rounded-lg bg-[#E0A800] px-5 py-3 font-semibold text-[#082419]">Want to talk sooner? Book a call →</a>
    </div>
  )

  return (
    <form action={submit} aria-busy={pending} className="space-y-5">
      <input type="hidden" name="applied_tier" value={searchParams.get('tier') === 'standard' ? 'standard' : 'founding'} />
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {([
        ['course_name', 'Course name', 'Your golf course', 'organization'],
        ['contact_name', 'Your name', 'Your name', 'name'],
        ['email', 'Email address', 'you@course.com', 'email'],
      ] as const).map(([key, label, placeholder, autoComplete]) => (
        <div key={key} className="space-y-2">
          <Label htmlFor={key} className="text-white">{label}</Label>
          <Input id={key} name={key} type={key === 'email' ? 'email' : 'text'} autoComplete={autoComplete} maxLength={255} required disabled={pending} value={values[key]} onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))} placeholder={placeholder} className="h-12 bg-white text-[#0F3D2E] text-base" />
        </div>
      ))}
      <Button type="submit" disabled={pending} className="h-12 w-full bg-[#E0A800] text-[#082419] hover:bg-[#E0A800]/90 font-semibold">{pending ? 'Sending…' : 'Talk to us about your course'}</Button>
      <p className="text-sm text-white/80">Just an introduction. We’ll ask about your software and setup when we follow up.</p>
    </form>
  )
}
