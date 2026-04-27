'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StepHeader from '@/components/onboarding/StepHeader'
import OnboardingNav from '@/components/onboarding/OnboardingNav'
import AmenitiesSelector from '@/components/onboarding/AmenitiesSelector'
import { saveStep4 } from '@/lib/actions/onboarding'
import type { CourseOnboarding } from '@/lib/db/courses'

type Props = {
  courseId: string
  course: CourseOnboarding | null
}

const INPUT =
  'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B6D11] w-full'
const LABEL = 'text-xs text-gray-500 block mb-1'

function generateDraft(course: CourseOnboarding | null): string {
  const holes = course?.holes ?? 18
  const city = course?.city ?? ''
  const state = course?.state ?? ''
  const name = course?.name ?? 'This course'
  const location = city && state ? `${city}, ${state}` : city || state || 'the area'
  return `A classic ${holes}-hole layout in ${location}. ${name} offers challenging fairways, well-maintained greens, and a welcoming atmosphere for golfers of all skill levels.`
}

const DEFAULT_AMENITIES = ['driving_range', 'putting_green', 'pro_shop', 'gps_carts']

export default function Step4Form({ courseId, course }: Props) {
  const router = useRouter()

  const [description, setDescription] = useState<string>(
    course?.description ?? generateDraft(course),
  )
  const [amenities, setAmenities] = useState<string[]>(
    course?.amenities ?? DEFAULT_AMENITIES,
  )

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleContinue() {
    setIsLoading(true)
    setError(null)
    try {
      await saveStep4(courseId, { description, amenities })
      router.push(`/onboarding/${courseId}/step-5`)
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
        step={4}
        title="Course profile"
        subtitle="Tell golfers what makes your course special."
      />

      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4">
        <div>
          <label className={LABEL}>Course description</label>
          <textarea
            className={`${INPUT} min-h-[120px] resize-y`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">
            Amenities
          </p>
          <AmenitiesSelector value={amenities} onChange={setAmenities} />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      <OnboardingNav
        courseId={courseId}
        prevStep={3}
        onContinue={handleContinue}
        isLoading={isLoading}
      />
    </div>
  )
}
