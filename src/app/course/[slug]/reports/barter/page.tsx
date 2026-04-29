import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCourseMetricHistory, calcStaffHoursSaved } from '@/lib/reports/courseMetrics'
import BarterCalculator from './BarterCalculator'

export default async function BarterReceiptPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/course/${slug}/login`)

  const admin = createAdminClient()
  const { data: course, error: courseError } = await admin.from('courses').select('id, name').eq('slug', slug).single()
  if (courseError && courseError.code !== 'PGRST116') throw new Error(`[BarterReceiptPage] course query failed: ${courseError.message}`)
  if (!course) notFound()

  const history = await getCourseMetricHistory(course.id, 12)
  const latest = history[history.length - 1]
  const monthsElapsed = new Date().getMonth() + 1

  const roundsMtd = latest?.rounds_booked ?? 0
  const avgGreenFee = Number(latest?.avg_green_fee ?? 0)
  const waitlistFills = latest?.waitlist_fills ?? 0
  const staffHoursSaved = calcStaffHoursSaved(waitlistFills)
  const membersMtd = latest?.members_attributed ?? 0
  const directBookings = roundsMtd

  const currentMonthLabel = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">The TeeAhead Difference</h1>
          <p className="text-[#6B7770] text-sm mt-1">{currentMonthLabel} — {course.name}</p>
        </div>
        <a
          href={`/api/reports/course/barter-pdf?slug=${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#1B4332] text-[#FAF7F2] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#163829]"
        >
          Download My Monthly Report
        </a>
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-[#1A1A1A] mb-4">This Month at a Glance</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <div className="text-2xl font-bold text-[#1B4332]">${Number(latest?.green_fee_revenue ?? 0).toLocaleString()}</div>
            <p className="text-xs text-[#6B7770] mt-1">Revenue Processed</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <div className="text-2xl font-bold text-[#1B4332]">{staffHoursSaved}h</div>
            <p className="text-xs text-[#6B7770] mt-1">Staff Hours Saved via Auto-Fill</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <div className="text-2xl font-bold text-[#1B4332]">{membersMtd}</div>
            <p className="text-xs text-[#6B7770] mt-1">Members Retained/Acquired</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <div className="text-2xl font-bold text-[#1B4332]">{directBookings.toLocaleString()}</div>
            <p className="text-xs text-[#6B7770] mt-1">Direct Bookings (no marketplace)</p>
          </div>
        </div>
      </div>

      {/* GolfNow Calculator */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-[#1A1A1A] mb-2">What GolfNow Would Have Cost You This Month</h2>
        <p className="text-sm text-[#6B7770] mb-6">
          Adjust the inputs below to see your exact barter cost comparison.
        </p>
        <BarterCalculator
          defaultRounds={roundsMtd}
          defaultAvgGreenFee={avgGreenFee}
          monthsElapsed={monthsElapsed}
        />
      </div>
    </div>
  )
}
