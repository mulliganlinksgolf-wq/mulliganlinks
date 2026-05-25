import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { TeeTimeSearch } from '@/components/TeeTimeSearch'

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ date?: string; holes?: string }>
}) {
  const { slug } = await params
  const { date: dateParam, holes: holesParam } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()
  if (!course) notFound()

  const { data: membership } = await supabase
    .from('memberships')
    .select('tier')
    .eq('user_id', user!.id)
    .eq('status', 'active')
    .single()

  const tier = membership?.tier ?? 'free'
  const wantsBackNine = holesParam === '9' && course.allow_back_nine_booking === true
  const teeStart: 'front' | 'back' = wantsBackNine ? 'back' : 'front'

  // Default to tomorrow if no date given (today likely has no slots yet)
  const selectedDate = dateParam ?? (() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  })()

  const { data: teeTimes } = await supabase
    .from('tee_times')
    .select('id, scheduled_at, available_players, base_price, special_price, special_label, tee_start, holes')
    .eq('course_id', course.id)
    .eq('status', 'open')
    .eq('tee_start', teeStart)
    .gte('scheduled_at', selectedDate + 'T00:00:00+00:00')
    .lte('scheduled_at', selectedDate + 'T23:59:59+00:00')
    .gt('available_players', 0)
    .order('scheduled_at')

  return (
    <div className="space-y-4">
      <div>
        <Link href="/app/courses" className="text-sm text-[#8FA889] hover:text-white">← All courses</Link>
        <h1 className="text-2xl font-bold text-white mt-2">{course.name}</h1>
        {course.city && <p className="text-[#8FA889]">{course.city}, {course.state}</p>}
      </div>

      {course.allow_back_nine_booking && (
        <div className="flex items-center gap-2" role="group" aria-label="Round length">
          <HolesLink slug={slug} date={selectedDate} holes={null} active={!wantsBackNine}>
            18 holes
          </HolesLink>
          <HolesLink slug={slug} date={selectedDate} holes="9" active={wantsBackNine}>
            9 holes (back)
          </HolesLink>
        </div>
      )}

      {wantsBackNine && (
        <p className="text-xs text-[#8FA889]">
          Back-9 rates may differ from full-round rates. Final pricing confirmed at checkout.
        </p>
      )}

      <TeeTimeSearch
        teeTimes={teeTimes ?? []}
        courseName={course.name}
        courseSlug={slug}
        selectedDate={selectedDate}
        tier={tier}
      />
    </div>
  )
}

function HolesLink({
  slug,
  date,
  holes,
  active,
  children,
}: {
  slug: string
  date: string
  holes: string | null
  active: boolean
  children: React.ReactNode
}) {
  const params = new URLSearchParams()
  params.set('date', date)
  if (holes) params.set('holes', holes)
  return (
    <Link
      href={`/app/courses/${slug}?${params.toString()}`}
      className={
        active
          ? 'px-3 py-1.5 text-xs font-semibold rounded-full bg-[#E0A800] text-[#082419]'
          : 'px-3 py-1.5 text-xs font-semibold rounded-full bg-white/10 text-[#F4F1EA] hover:bg-white/20'
      }
    >
      {children}
    </Link>
  )
}
