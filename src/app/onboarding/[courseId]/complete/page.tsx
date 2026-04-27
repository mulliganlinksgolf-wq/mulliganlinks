import { getCourseById } from '@/lib/db/courses'

export default async function CompletePage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const course = await getCourseById(courseId)
  const courseName = course?.name ?? 'Your course'

  const checklist = [
    'Tee sheet live and accepting bookings',
    'Booking widget ready to install',
    'Fairway Points auto-awarded on every round',
    'Member discount logic active',
    'Email confirmations configured',
  ]

  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-[#EAF3DE] rounded-full flex items-center justify-center mx-auto mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-8 text-[#3B6D11]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-xl font-semibold text-gray-900 mb-2">
        {courseName} is live on TeeAhead
      </h1>
      <p className="text-gray-500 text-sm mb-8">
        Your tee sheet is active. Golfers can start booking.
      </p>

      <div className="bg-white border border-gray-200 rounded-xl p-5 text-left max-w-md mx-auto mb-8">
        {checklist.map((item) => (
          <div
            key={item}
            className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0"
          >
            <div className="w-4 h-4 bg-[#3B6D11] rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-2.5 h-2.5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-sm text-gray-700">{item}</span>
          </div>
        ))}
      </div>

      <a
        href="/dashboard"
        className="bg-[#3B6D11] text-white rounded-lg px-6 py-3 text-sm hover:bg-[#27500A] transition-colors inline-block"
      >
        Go to your dashboard →
      </a>
    </div>
  )
}
