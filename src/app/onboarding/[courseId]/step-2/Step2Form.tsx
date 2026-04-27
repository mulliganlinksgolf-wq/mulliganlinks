'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StepHeader from '@/components/onboarding/StepHeader'
import OnboardingNav from '@/components/onboarding/OnboardingNav'
import HoursEditor, { DEFAULT_HOURS, type DayHours } from '@/components/onboarding/HoursEditor'
import { saveStep2 } from '@/lib/actions/onboarding'
import type { CourseOnboarding } from '@/lib/db/courses'
import type { TeeSheetConfig, CourseHours } from '@/lib/db/onboarding'

type Props = {
  courseId: string
  course: CourseOnboarding | null
  config: TeeSheetConfig | null
  dbHours: CourseHours[]
}

const INPUT =
  'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B6D11] w-full'
const LABEL = 'text-xs text-gray-500 block mb-1'

function dbHoursToDayHours(dbHours: CourseHours[]): DayHours[] {
  const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  if (dbHours.length === 0) return DEFAULT_HOURS
  return DAY_LABELS.map((label, i) => {
    const db = dbHours.find((h) => h.day_of_week === i)
    if (!db) return DEFAULT_HOURS[i]
    return {
      dayOfWeek: i,
      label,
      isOpen: db.is_open,
      openTime: db.open_time,
      closeTime: db.close_time,
    }
  })
}

export default function Step2Form({ courseId, config, dbHours }: Props) {
  const router = useRouter()

  const [intervalMinutes, setIntervalMinutes] = useState<number>(
    config?.interval_minutes ?? 8,
  )
  const [maxPlayers, setMaxPlayers] = useState<number>(config?.max_players ?? 4)
  const [advanceBookingDays, setAdvanceBookingDays] = useState<number>(
    config?.advance_booking_days ?? 7,
  )
  const [cartPolicy, setCartPolicy] = useState<'mandatory' | 'optional' | 'walking_only'>(
    config?.cart_policy ?? 'optional',
  )
  const [hours, setHours] = useState<DayHours[]>(dbHoursToDayHours(dbHours))

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleContinue() {
    setIsLoading(true)
    setError(null)
    try {
      await saveStep2(courseId, {
        intervalMinutes,
        maxPlayers,
        advanceBookingDays,
        cartPolicy,
        hours: hours.map((h) => ({
          dayOfWeek: h.dayOfWeek,
          isOpen: h.isOpen,
          openTime: h.openTime,
          closeTime: h.closeTime,
        })),
      })
      router.push(`/onboarding/${courseId}/step-3`)
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <StepHeader
        step={2}
        title="Tee sheet setup"
        subtitle="Configure how your tee sheet works."
      />

      <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
        We&apos;ve pre-filled common defaults. Change only what&apos;s different for your course.
      </p>

      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>Tee time interval</label>
            <select
              className={INPUT}
              value={intervalMinutes}
              onChange={(e) => setIntervalMinutes(Number(e.target.value))}
            >
              <option value={7}>7 minutes</option>
              <option value={8}>8 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={12}>12 minutes</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Max players per tee time</label>
            <select
              className={INPUT}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
            >
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Advance booking window</label>
            <select
              className={INPUT}
              value={advanceBookingDays}
              onChange={(e) => setAdvanceBookingDays(Number(e.target.value))}
            >
              <option value={3}>3 days</option>
              <option value={5}>5 days</option>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Cart policy</label>
            <select
              className={INPUT}
              value={cartPolicy}
              onChange={(e) =>
                setCartPolicy(e.target.value as 'mandatory' | 'optional' | 'walking_only')
              }
            >
              <option value="mandatory">Cart mandatory</option>
              <option value="optional">Cart optional</option>
              <option value="walking_only">Walking only</option>
            </select>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">
            Operating hours
          </p>
          <HoursEditor value={hours} onChange={setHours} />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      <OnboardingNav
        courseId={courseId}
        prevStep={1}
        onContinue={handleContinue}
        isLoading={isLoading}
      />
    </div>
  )
}
