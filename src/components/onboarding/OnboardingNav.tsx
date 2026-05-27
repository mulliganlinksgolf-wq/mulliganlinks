'use client'

import { useRouter } from 'next/navigation'

type Props = {
  courseId: string
  prevStep?: number
  onContinue?: () => void
  continueLabel?: string
  isLoading?: boolean
}

export default function OnboardingNav({
  courseId,
  prevStep,
  onContinue,
  continueLabel,
  isLoading,
}: Props) {
  const router = useRouter()

  return (
    <div className="flex items-center justify-between">
      <div>
        {prevStep !== undefined && (
          <button
            type="button"
            onClick={() => router.push(`/onboarding/${courseId}/step-${prevStep}`)}
            className="bg-white text-gray-500 border border-gray-300 rounded-lg px-5 py-2.5 text-sm hover:bg-gray-50"
          >
            ← Back
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onContinue}
        disabled={isLoading}
        className="bg-[#3B6D11] text-white rounded-lg px-5 py-2.5 text-sm hover:bg-[#27500A] transition-colors disabled:opacity-60"
      >
        {isLoading ? 'Saving…' : (continueLabel ?? 'Continue →')}
      </button>
    </div>
  )
}
