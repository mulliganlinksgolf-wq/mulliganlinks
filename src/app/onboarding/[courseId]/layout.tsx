import { getCourseById } from '@/lib/db/courses'
import OnboardingProgressBar from '@/components/onboarding/OnboardingProgressBar'

export default async function OnboardingLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const course = await getCourseById(courseId)

  const step = course?.onboarding_step ?? 1
  const showProgress = step <= 5

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm font-semibold text-[#3B6D11]">TeeAhead</span>
          {showProgress && <OnboardingProgressBar currentStep={Math.min(step, 5)} />}
        </div>
        {children}
      </div>
    </div>
  )
}
