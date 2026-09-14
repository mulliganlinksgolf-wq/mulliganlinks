'use client'

import { useState, useTransition } from 'react'
import { saveCoursePreference } from './actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export function CoursePreferenceForm({ token }: { token: string }) {
  const [course, setCourse] = useState('')
  const [saved, setSaved] = useState(false)
  const [skipped, setSkipped] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  if (saved) return <p role="status" className="text-sm">Thanks—we’ve noted your course. Your signup is complete.</p>
  if (skipped) return <p className="text-sm">You’re all set. Watch your inbox for launch updates.</p>
  return (
    <form className="border-t border-white/20 pt-5 space-y-3" action={() => {
      setError(null)
      startTransition(async () => {
        try {
          const result = await saveCoursePreference(token, course)
          if (result.success) setSaved(true)
          else setError(result.error ?? 'Please try again.')
        } catch { setError('We couldn’t save your course. Your waitlist signup is still complete. You can reply to your email instead.') }
      })
    }} aria-busy={pending}>
      <Label htmlFor="favorite_course">Where do you usually play? (Optional)</Label>
      <p id="course-help" className="text-sm text-white/80">Course name and town help us understand where golfers want TeeAhead.</p>
      <Input id="favorite_course" name="favorite_course" aria-describedby="course-help" maxLength={255} required value={course} onChange={e => setCourse(e.target.value)} disabled={pending} placeholder="Course name, town" className="h-12 bg-white text-[#0F3D2E] text-base" />
      {error && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending} className="bg-[#E0A800] text-[#082419] hover:bg-[#E0A800]/90">{pending ? 'Saving…' : 'Save my course'}</Button>
        <button type="button" disabled={pending} onClick={() => setSkipped(true)} className="underline text-sm px-3 py-2">Skip for now</button>
      </div>
    </form>
  )
}
