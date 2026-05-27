import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { requireManager } from '@/lib/courseRole'
import { CoursePageHeader } from '@/components/course/CoursePageHeader'
import { ReferralWidget } from './_components/ReferralWidget'

export default async function CourseDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  await requireManager(slug)
  const supabase = await createClient()

  const { data: course } = await supabase
    .from('courses')
    .select('id, name, referral_code')
    .eq('slug', slug)
    .single()
  if (!course) notFound()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7)

  const { data: todayBookings } = await supabase
    .from('bookings')
    .select('id, total_paid, status, tee_times!inner(scheduled_at, course_id)')
    .eq('tee_times.course_id', course.id)
    .gte('tee_times.scheduled_at', today.toISOString())
    .neq('status', 'canceled')

  const { data: weekBookings } = await supabase
    .from('bookings')
    .select('total_paid, tee_times!inner(course_id)')
    .eq('tee_times.course_id', course.id)
    .gte('created_at', weekStart.toISOString())
    .neq('status', 'canceled')

  const { data: teeTimes30 } = await supabase
    .from('tee_times')
    .select('id, status')
    .eq('course_id', course.id)
    .gte('scheduled_at', thirtyDaysAgo.toISOString())

  const { data: topSpenders } = await supabase
    .from('bookings')
    .select('user_id, total_paid, profiles!inner(full_name), tee_times!inner(course_id)')
    .eq('tee_times.course_id', course.id)
    .neq('status', 'canceled')
    .order('total_paid', { ascending: false })
    .limit(50)

  const todayRevenue = todayBookings?.reduce((s, b) => s + (b.total_paid ?? 0), 0) ?? 0
  const weekRevenue = weekBookings?.reduce((s, b) => s + (b.total_paid ?? 0), 0) ?? 0
  const totalSlots = teeTimes30?.length ?? 0
  const bookedSlots = teeTimes30?.filter(t => t.status === 'booked').length ?? 0
  const utilizationPct = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0

  const spenderMap = new Map<string, { name: string; spent: number }>()
  for (const b of topSpenders ?? []) {
    const e = spenderMap.get(b.user_id)
    if (e) e.spent += b.total_paid ?? 0
    else spenderMap.set(b.user_id, { name: (b.profiles as { full_name?: string } | null)?.full_name ?? '—', spent: b.total_paid ?? 0 })
  }
  const topMembers = Array.from(spenderMap.values())
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 6)

  const courseFirstName = course.name.split(' ')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  // Day-zero: GM has no tee times configured yet → show 3-step onboarding instead of stat grid
  const isDayZero = totalSlots === 0 && (todayBookings?.length ?? 0) === 0 && (weekBookings?.length ?? 0) === 0

  if (isDayZero) {
    return (
      <>
        <CoursePageHeader
          title={`${greeting}.`}
          subtitle={`Welcome to ${course.name}'s TeeAhead dashboard. Let's get you live.`}
        />
        <div className="flex-1 p-7 flex flex-col gap-6 overflow-y-auto">
          <DayZeroOnboarding slug={slug} />
          <ReferralWidget courseId={course.id} slug={slug} referralCode={course.referral_code} />
        </div>
      </>
    )
  }

  return (
    <>
      <CoursePageHeader
        title={`${greeting}.`}
        subtitle={`Today's sheet is ${utilizationPct}% booked · ${bookedSlots} of ${totalSlots} slots taken.`}
        action={
          <Link
            href={`/course/${slug}/tee-times`}
            className="px-3.5 py-2 rounded-md bg-[#0F3D2E] text-[#F4F1EA] text-[13px] font-semibold hover:bg-[#0F3D2E]/90"
          >
            + Add tee times
          </Link>
        }
      />

      <div className="flex-1 p-7 flex flex-col gap-5 overflow-y-auto">
        {/* Stat row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <StatCard label="Today's revenue" value={`$${todayRevenue.toLocaleString()}`} delta={`${todayBookings?.length ?? 0} bookings today`} />
          <StatCard label="This week" value={`$${weekRevenue.toLocaleString()}`} delta={`${weekBookings?.length ?? 0} bookings this week`} up />
          <StatCard label="Utilization · 30d" value={`${utilizationPct}%`} delta={`${bookedSlots} of ${totalSlots} slots booked`} up={utilizationPct >= 50} />
          <StatCard label="Active members" value={`${spenderMap.size}`} delta="have booked here" />
        </div>

        {/* Referral widget passthrough */}
        <ReferralWidget courseId={course.id} slug={slug} referralCode={course.referral_code} />

        {/* Top members panel */}
        <div className="bg-white rounded-[10px] border border-[#0F3D2E]/10 px-5 py-4 flex flex-col">
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <p className="font-mono text-[10.5px] tracking-[0.12em] uppercase text-[#6B7770] font-semibold">Top members · YTD spend</p>
              <p className="text-[11.5px] text-[#6B7770] mt-1">
                Your data, owned by you at {courseFirstName}.{' '}
                <Link href={`/course/${slug}/members?export=csv`} className="text-[#0F3D2E] underline underline-offset-2">Export CSV →</Link>
              </p>
            </div>
          </div>

          {topMembers.length === 0 ? (
            <p className="text-sm text-[#6B7770] py-6 text-center">No booking data yet — your top members will appear here once bookings start coming in.</p>
          ) : (
            <div className="overflow-x-auto">
              {topMembers.map((m, i) => (
                <div key={m.name + i} className="grid grid-cols-[20px_1fr_120px] gap-2.5 py-2.5 border-b border-[#0F3D2E]/10 items-center last:border-b-0">
                  <span className="font-mono text-[10px] text-[#6B7770]">0{i + 1}</span>
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-[#1A1A1A] truncate">{m.name}</div>
                  </div>
                  <span className="font-mono text-xs font-semibold text-[#0F3D2E] text-right">${m.spent.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function DayZeroOnboarding({ slug }: { slug: string }) {
  const steps = [
    {
      n: '01',
      title: 'Set your first tee times',
      desc: 'Open the tee sheet and create your booking window — 6:20 AM start, 10-minute intervals, your usual rack rates.',
      status: 'current' as const,
      cta: { label: 'Open tee sheet →', href: `/course/${slug}/tee-times/create` },
    },
    {
      n: '02',
      title: 'Drop a QR code at the pro shop',
      desc: 'One sticker = every walk-in golfer earns Fairway Points instantly. Print from the Install page.',
      status: 'next' as const,
      cta: { label: 'Print QR pack →', href: `/course/${slug}/install` },
    },
    {
      n: '03',
      title: 'Email your regulars',
      desc: 'A 3-sentence email to your existing list. We have a template — most courses see 60% sign up the first week.',
      status: 'next' as const,
      cta: { label: 'Open the template →', href: `/course/${slug}/help` },
    },
  ]

  return (
    <div className="bg-white rounded-xl border border-[#0F3D2E]/10 overflow-hidden">
      <div className="bg-[#082419] px-6 py-5 text-[#F4F1EA]">
        <p className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-[#E0A800] font-semibold">
          You&apos;re 48 hours from live
        </p>
        <h2
          className="font-display mt-2 leading-[1.05] tracking-[-0.02em]"
          style={{ fontSize: 'clamp(28px, 3.6vw, 38px)', fontWeight: 400 }}
        >
          Three steps to your first <em className="italic text-[#E0A800]">booked round.</em>
        </h2>
      </div>

      <div className="divide-y divide-[#0F3D2E]/10">
        {steps.map((s, i) => (
          <div key={s.n} className="grid grid-cols-[60px_1fr_auto] gap-4 px-6 py-5 items-center">
            <p className={`font-mono text-[11px] tracking-[0.14em] font-bold ${i === 0 ? 'text-[#E0A800]' : 'text-[#6B7770]'}`}>{s.n}</p>
            <div className="min-w-0">
              <p className="font-display text-xl text-[#0F3D2E] tracking-[-0.01em]" style={{ fontWeight: 400 }}>{s.title}</p>
              <p className="text-[12.5px] text-[#6B7770] mt-1 leading-relaxed">{s.desc}</p>
            </div>
            {i === 0 ? (
              <Link
                href={s.cta.href}
                className="px-4 py-2.5 rounded-md bg-[#E0A800] text-[#082419] text-[13px] font-bold hover:bg-[#E0A800]/90 whitespace-nowrap"
              >
                {s.cta.label}
              </Link>
            ) : (
              <Link
                href={s.cta.href}
                className="px-4 py-2.5 rounded-md border border-[#0F3D2E]/15 text-[#0F3D2E] text-[13px] font-semibold hover:bg-[#0F3D2E]/5 whitespace-nowrap"
              >
                {s.cta.label}
              </Link>
            )}
          </div>
        ))}
      </div>

      <div className="px-6 py-4 bg-[#FAF7F2] border-t border-[#0F3D2E]/10 flex items-center justify-between gap-3">
        <p className="text-[12.5px] text-[#6B7770]">
          Stuck? <a href="mailto:hello@teeahead.com" className="text-[#0F3D2E] font-semibold underline underline-offset-2">Email Neil directly →</a>
        </p>
        <span className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-[#6B7770]">Avg time to live: 38 hrs</span>
      </div>
    </div>
  )
}

function StatCard({ label, value, delta, up }: { label: string; value: string; delta: string; up?: boolean }) {
  return (
    <div className="bg-white rounded-[10px] px-5 py-4 border border-[#0F3D2E]/10">
      <p className="font-mono text-[10.5px] tracking-[0.12em] uppercase text-[#6B7770] font-semibold">{label}</p>
      <p
        className="font-display text-4xl text-[#0F3D2E] mt-1.5 leading-none tracking-[-0.02em]"
        style={{ fontWeight: 400 }}
      >
        {value}
      </p>
      <p className={`mt-2 text-[11.5px] ${up ? 'text-[#2F8C5F]' : 'text-[#6B7770]'}`}>
        {up && '▲ '}{delta}
      </p>
    </div>
  )
}
