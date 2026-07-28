import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { TeeTimeSearch } from '@/components/TeeTimeSearch'
import { getAvailability } from '@/lib/tee-time-availability'

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

  // Fetch availability via the tee_time_occupancy view (self-grouping Sprint 5 helper)
  const availability = await getAvailability({
    courseId: course.id,
    date: selectedDate,
  })

  // Occupancy view doesn't carry price/special/tee_start fields, fetch those from tee_times and merge.
  const ids = availability.map(a => a.teeTimeId)
  const { data: teeTimeMeta } = ids.length > 0
    ? await supabase
        .from('tee_times')
        .select('id, base_price, special_price, special_label, max_players, status, tee_start, holes')
        .in('id', ids)
    : { data: [] as Array<{ id: string; base_price: number; special_price: number | null; special_label: string | null; max_players: number; status: string; tee_start: string | null; holes: number | null }> }

  const metaMap = new Map(
    (teeTimeMeta ?? []).map(t => [t.id as string, t])
  )

  // Sprint 6: also pull computed_rate / fired_rule_labels for any slot in view.
  const { data: computedRates } = ids.length > 0
    ? await supabase
        .from('tee_time_computed_rates')
        .select('tee_time_id, computed_rate, fired_rule_labels')
        .in('tee_time_id', ids)
    : { data: [] as Array<{ tee_time_id: string; computed_rate: number | string; fired_rule_labels: string[] | null }> }

  const computedMap = new Map(
    (computedRates ?? []).map(r => [r.tee_time_id as string, {
      computed_rate: r.computed_rate != null ? Number(r.computed_rate) : null,
      fired_rule_labels: r.fired_rule_labels ?? null,
    }])
  )

  const teeTimes = availability
    // Hide already-full slots, slots whose underlying tee_time isn't open,
    // and slots whose tee_start doesn't match the user's front/back choice
    .filter(a => {
      if (a.isFull) return false
      const meta = metaMap.get(a.teeTimeId)
      if (!meta || meta.status !== 'open') return false
      if (meta.tee_start !== teeStart) return false
      return true
    })
    .map(a => {
      const meta = metaMap.get(a.teeTimeId)
      const cr = computedMap.get(a.teeTimeId)
      const maxPlayers = (meta?.max_players ?? 4) as number
      return {
        id: a.teeTimeId,
        scheduled_at: a.scheduledAt,
        available_players: a.spotsRemaining,
        base_price: (meta?.base_price ?? 0) as number,
        special_price: (meta?.special_price ?? null) as number | null,
        special_label: (meta?.special_label ?? null) as string | null,
        computed_rate: cr?.computed_rate ?? null,
        fired_rule_labels: cr?.fired_rule_labels ?? null,
        max_players: maxPlayers,
        players_booked: maxPlayers - a.spotsRemaining,
        is_partially_booked: a.isPartiallyBooked,
        has_self_grouped_bookings: a.hasSelfGroupedBookings,
      }
    })

  // Resolve self-grouping availability: course-level flag + per-day override
  const allowSelfGrouping = (course as { allow_self_grouping?: boolean }).allow_self_grouping ?? true

  const { data: override } = await supabase
    .from('course_tee_sheet_overrides')
    .select('self_grouping_disabled')
    .eq('course_id', course.id)
    .eq('override_date', selectedDate)
    .maybeSingle()

  const selfGroupingAvailable = allowSelfGrouping && !override?.self_grouping_disabled

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
        teeTimes={teeTimes}
        courseName={course.name}
        courseSlug={slug}
        selectedDate={selectedDate}
        tier={tier}
        selfGroupingAvailable={selfGroupingAvailable}
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
