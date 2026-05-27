'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StepHeader from '@/components/onboarding/StepHeader'
import OnboardingNav from '@/components/onboarding/OnboardingNav'
import PlatformInstallGuide from '@/components/onboarding/PlatformInstallGuide'
import { goLive } from '@/lib/actions/onboarding'

type Props = {
  courseId: string
  courseSlug: string
}

export default function Step5Page({ courseId, courseSlug }: Props) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGoLive() {
    setIsLoading(true)
    setError(null)
    try {
      await goLive(courseId)
      router.push(`/onboarding/${courseId}/complete`)
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <StepHeader
        step={5}
        title="Install your booking widget"
        subtitle="Choose your platform to get step-by-step instructions."
      />

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <PlatformInstallGuide courseSlug={courseSlug} />
      </div>

      <hr className="border-t border-gray-200" />

      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Go live</p>
        <p className="text-sm text-gray-600">
          Everything&apos;s set up. Click below to make your course live on TeeAhead.
        </p>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          type="button"
          onClick={handleGoLive}
          disabled={isLoading}
          className="bg-[#3B6D11] text-white rounded-lg px-5 py-2.5 text-sm hover:bg-[#27500A] transition-colors disabled:opacity-60 w-full"
        >
          {isLoading ? 'Going live…' : 'Go live →'}
        </button>
      </div>

      <OnboardingNav courseId={courseId} prevStep={4} onContinue={handleGoLive} isLoading={isLoading} />
    </div>
  )
}
