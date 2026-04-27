import { getCourseByInviteToken } from '@/lib/db/courses'
import { redirect } from 'next/navigation'

export default async function OnboardingEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    return <InvalidInvite />
  }

  const course = await getCourseByInviteToken(token)

  if (!course) {
    return <InvalidInvite />
  }

  // invite_used is set at go-live; block reuse of the link after completion
  if (course.invite_used && course.onboarding_complete) {
    redirect(`/onboarding/${course.id}/complete`)
  }
  if (course.invite_used && !course.onboarding_complete) {
    return <InvalidInvite />
  }

  if (course.onboarding_complete) {
    redirect(`/onboarding/${course.id}/complete`)
  }

  const step = course.onboarding_step ?? 1
  redirect(`/onboarding/${course.id}/step-${step}`)
}

function InvalidInvite() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto text-center p-8">
        <div className="text-4xl mb-4">⛳</div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Invalid invite link</h1>
        <p className="text-gray-500 text-sm">
          This invite link is invalid or has already been used.{' '}
          <a href="mailto:neil@teeahead.com" className="text-[#3B6D11] hover:underline">
            Contact neil@teeahead.com
          </a>{' '}
          for a new link.
        </p>
      </div>
    </div>
  )
}
