import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { TeeTimeSearch } from '@/components/TeeTimeSearch'

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ date?: string }>
}) {
  const { slug } = await params
  const { date: dateParam } = await searchParams
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
  const discountPct = tier === 'ace' ? 15 : tier === 'eagle' ? 10 : 0

  // Default to tomorrow if no date given (today likely has no slots yet)
  const selectedDate = dateParam ?? (() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  })()

  const { data: teeTimes } = await supabase
    .from('tee_times')
    .select('id, scheduled_at, available_players, base_price')
    .eq('course_id', course.id)
    .eq('status', 'open')
    .gte('scheduled_at', selectedDate + 'T00:00:00+00:00')
    .lte('scheduled_at', selectedDate + 'T23:59:59+00:00')
    .gt('available_players', 0)
    .order('scheduled_at')

  return (
    <div className="space-y-4">
      <div>
        <Link href="/app/courses" className="text-sm text-[#6B7770] hover:text-[#1A1A1A]">← All courses</Link>
        <h1 className="text-2xl font-bold text-[#1A1A1A] mt-2">{course.name}</h1>
        {course.city && <p className="text-[#6B7770]">{course.city}, {course.state}</p>}
      </div>

      <TeeTimeSearch
        teeTimes={teeTimes ?? []}
        courseName={course.name}
        courseSlug={slug}
        selectedDate={selectedDate}
        discountPct={discountPct}
        tier={tier}
      />
    </div>
  )
}
