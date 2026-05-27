'use client'

import { useState, useTransition } from 'react'
import { upsertAvailability } from '../actions'
import type { TimePreference, HolePreference } from '@/types/partners'

type Course = { id: string; name: string }

export function AvailabilityForm({ courses }: { courses: Course[] }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const todayStr = new Date().toISOString().slice(0, 10)
  const maxDate = new Date(Date.now() + 60 * 86_400_000).toISOString().slice(0, 10)

  const [date, setDate] = useState(todayStr)
  const [timePreference, setTimePreference] = useState<TimePreference>('flexible')
  const [courseId, setCourseId] = useState('')
  const [holes, setHoles] = useState<HolePreference>('either')
  const [notes, setNotes] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await upsertAvailability({
        available_date: date,
        time_preference: timePreference,
        course_id: courseId || undefined,
        holes,
        notes: notes || undefined,
      })
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setDate(todayStr)
        setTimePreference('flexible')
        setCourseId('')
        setHoles('either')
        setNotes('')
      }
    })
  }

  const timeOptions: TimePreference[] = ['morning', 'afternoon', 'evening', 'flexible']
  const holeOptions: HolePreference[] = ['9', '18', 'either']

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div>
        <label htmlFor="avail-date" className="block text-sm font-medium text-white mb-1">
          Date
        </label>
        <input
          id="avail-date"
          type="date"
          required
          min={todayStr}
          max={maxDate}
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full rounded-lg bg-white/10 border border-white/20 text-white px-3 py-2 text-sm"
        />
      </div>

      <div>
        <span className="block text-sm font-medium text-white mb-2">Time of Day</span>
        <div className="flex gap-2 flex-wrap">
          {timeOptions.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTimePreference(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                timePreference === t ? 'bg-white text-[#1B4332]' : 'bg-white/10 text-[#8FA889] hover:bg-white/20'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="avail-course" className="block text-sm font-medium text-white mb-1">
          Preferred Course <span className="text-[#8FA889] font-normal">(optional)</span>
        </label>
        <select
          id="avail-course"
          value={courseId}
          onChange={e => setCourseId(e.target.value)}
          className="w-full rounded-lg bg-white/10 border border-white/20 text-white px-3 py-2 text-sm"
        >
          <option value="">No preference</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <span className="block text-sm font-medium text-white mb-2">Holes</span>
        <div className="flex gap-2">
          {holeOptions.map(h => (
            <button
              key={h}
              type="button"
              onClick={() => setHoles(h)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                holes === h ? 'bg-white text-[#1B4332]' : 'bg-white/10 text-[#8FA889] hover:bg-white/20'
              }`}
            >
              {h === 'either' ? 'Either' : `${h} holes`}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="avail-notes" className="block text-sm font-medium text-white mb-1">
          Notes <span className="text-[#8FA889] font-normal">(optional)</span>
        </label>
        <textarea
          id="avail-notes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          maxLength={140}
          rows={2}
          placeholder="e.g. Looking to play a quick 9 after work"
          className="w-full rounded-lg bg-white/10 border border-white/20 text-white px-3 py-2 text-sm placeholder:text-[#8FA889] resize-none"
        />
        <p className="text-xs text-[#8FA889] mt-1 text-right">{notes.length} / 140</p>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {success && <p className="text-[#52B788] text-sm">Availability added!</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-white text-[#1B4332] font-semibold py-2.5 rounded-lg hover:bg-[#FAF7F2] disabled:opacity-50"
      >
        {isPending ? 'Adding…' : 'Add Availability'}
      </button>
    </form>
  )
}
