import { TeeAheadLogo } from '@/components/TeeAheadLogo'
import OnboardingProgressBarNav from '@/components/onboarding/OnboardingProgressBarNav'

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
  params: Promise<{ courseId: string }>
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <TeeAheadLogo className="h-6 w-auto" />
          <OnboardingProgressBarNav />
        </div>
        {children}
      </div>
    </div>
  )
}
