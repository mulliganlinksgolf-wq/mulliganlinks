import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { PublicTeeTimeGrid } from './PublicTeeTimeGrid'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: course } = await supabase.from('courses').select('name').eq('slug', slug).eq('status', 'active').single()
  return {
    title: course ? `Book Tee Times at ${course.name} | TeeAhead` : 'Book Tee Times | TeeAhead',
  }
}

export default async function PublicBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ date?: string }>
}) {
  const { slug } = await params
  const { date: dateParam } = await searchParams
  const supabase = await createClient()

  const { data: course } = await supabase
    .from('courses')
    .select('id, name, city, state, slug')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (!course) notFound()

  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
  const selectedDate = (dateParam && DATE_RE.test(dateParam))
    ? dateParam
    : new Date().toISOString().split('T')[0]
  const startOfDay = `${selectedDate}T00:00:00+00:00`
  const endOfDay = `${selectedDate}T23:59:59+00:00`

  const { data: teeTimes } = await supabase
    .from('tee_times')
    .select('id, scheduled_at, available_players, base_price')
    .eq('course_id', course.id)
    .eq('status', 'open')
    .gt('available_players', 0)
    .gte('scheduled_at', startOfDay)
    .lte('scheduled_at', endOfDay)
    .order('scheduled_at')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Minimal header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link href="https://teeahead.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
          <Image src="/logo.png" alt="TeeAhead" width={28} height={28} />
          <span className="font-bold text-[#1B4332] text-sm">TeeAhead</span>
        </Link>
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900">{course.name}</p>
          {course.city && (
            <p className="text-xs text-gray-500">{course.city}, {course.state}</p>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <PublicTeeTimeGrid
          teeTimes={teeTimes ?? []}
          courseName={course.name}
          courseSlug={slug}
          selectedDate={selectedDate}
        />
      </main>
    </div>
  )
}
