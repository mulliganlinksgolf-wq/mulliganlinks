import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { TeeSheetGrid } from '@/components/course/TeeSheetGrid'
import { CoursePageHeader } from '@/components/course/CoursePageHeader'

export default async function TeeSheetPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ date?: string }>
}) {
  const { slug } = await params
  const { date: dateParam } = await searchParams

  const selectedDate = dateParam
    ? new Date(dateParam + 'T00:00:00')
    : new Date()

  const dateStr = selectedDate.toISOString().split('T')[0]

  const nextDate = new Date(selectedDate)
  nextDate.setDate(nextDate.getDate() + 1)
  const prevDate = new Date(selectedDate)
  prevDate.setDate(prevDate.getDate() - 1)

  const supabase = await createClient()

  const { data: course } = await supabase
    .from('courses')
    .select('id, name')
    .eq('slug', slug)
    .single()

  if (!course) notFound()

  const startOfDay = `${dateStr}T00:00:00+00:00`
  const endOfDay = `${dateStr}T23:59:59+00:00`

  const { data: teeTimes } = await supabase
    .from('tee_times')
    .select(`
      id, scheduled_at, max_players, available_players, base_price, status, special_price, special_label,
      bookings(id, players, total_paid, status, payment_status, points_awarded, user_id, guest_name, guest_phone, guest_email, payment_method, cart_selected,
        profiles(full_name)
      )
    `)
    .eq('course_id', course.id)
    .gte('scheduled_at', startOfDay)
    .lte('scheduled_at', endOfDay)
    .order('scheduled_at')

  const formatDateParam = (d: Date) => d.toISOString().split('T')[0]
  const dayTitle = selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const total = teeTimes?.length ?? 0
  const booked = teeTimes?.filter(t => t.status === 'booked').length ?? 0
  const utilization = total > 0 ? Math.round((booked / total) * 100) : 0
  const openSlots = teeTimes?.reduce((s, t) => s + (t.available_players ?? 0), 0) ?? 0

  return (
    <>
      <CoursePageHeader
        title={dayTitle}
        subtitle={total > 0
          ? `${utilization}% booked · ${booked} of ${total} slots · ${openSlots} open seats`
          : 'No tee times configured for this day yet'}
        action={
          <div className="flex items-center gap-2">
            <Link
              href={`/course/${slug}?date=${formatDateParam(prevDate)}`}
              className="px-3 py-2 text-[13px] border border-[#0F3D2E]/15 rounded-md text-[#0F3D2E] hover:bg-[#0F3D2E]/5"
            >
              ← Prev
            </Link>
            <Link
              href={`/course/${slug}`}
              className="px-3 py-2 text-[13px] border border-[#0F3D2E]/15 rounded-md text-[#0F3D2E] hover:bg-[#0F3D2E]/5"
            >
              Today
            </Link>
            <Link
              href={`/course/${slug}?date=${formatDateParam(nextDate)}`}
              className="px-3 py-2 text-[13px] border border-[#0F3D2E]/15 rounded-md text-[#0F3D2E] hover:bg-[#0F3D2E]/5"
            >
              Next →
            </Link>
            <Link
              href={`/course/${slug}/tee-times/create`}
              className="px-3.5 py-2 rounded-md bg-[#0F3D2E] text-[#F4F1EA] text-[13px] font-semibold hover:bg-[#0F3D2E]/90"
            >
              + Tee times
            </Link>
          </div>
        }
      />

      <div className="flex-1 p-5 lg:p-6 grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-3.5 overflow-y-auto">
        <div className="min-w-0">
          {!teeTimes || teeTimes.length === 0 ? (
            <div className="bg-white rounded-[10px] border border-[#0F3D2E]/10 p-12 text-center">
              <p className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-[#6B7770] font-semibold mb-3">No tee times</p>
              <p className="text-[#6B7770] text-sm mb-5">Nothing on the sheet for this day yet. Create your first wave.</p>
              <Link
                href={`/course/${slug}/tee-times/create`}
                className="inline-block px-4 py-2.5 bg-[#0F3D2E] text-[#F4F1EA] rounded-md hover:bg-[#0F3D2E]/90 text-[13px] font-semibold"
              >
                Create tee times →
              </Link>
            </div>
          ) : (
            <TeeSheetGrid teeTimes={teeTimes as unknown as Parameters<typeof TeeSheetGrid>[0]['teeTimes']} slug={slug} courseId={course.id} courseName={course.name} />
          )}
        </div>

        {/* Right rail */}
        <div className="flex flex-col gap-3.5">
          <LegendCard />
          <DayGlance booked={booked} total={total} openSlots={openSlots} utilization={utilization} />
          {openSlots > 0 && total > 0 && <QuickActionCard openSlots={openSlots} />}
          <Link
            href={`/course/${slug}/tee-times/settings`}
            className="text-xs text-[#6B7770] hover:text-[#0F3D2E] underline underline-offset-2 px-1"
          >
            Tee sheet settings →
          </Link>
        </div>
      </div>
    </>
  )
}

function LegendCard() {
  return (
    <div className="bg-white rounded-[10px] border border-[#0F3D2E]/10 px-4 py-4">
      <p className="font-mono text-[10.5px] tracking-[0.12em] uppercase text-[#6B7770] font-semibold mb-3">Legend</p>
      {[
        { c: 'bg-[#0F3D2E]', l: 'Eagle / Ace member' },
        { c: 'bg-[#0F3D2E]/55', l: 'Fairway / non-member' },
        { c: 'bg-[#E0A800]', l: 'Comp round' },
        { c: 'border border-dashed border-[#0F3D2E]/15', l: 'Open slot' },
      ].map(({ c, l }) => (
        <div key={l} className="flex items-center gap-2.5 py-1.5">
          <span className={`w-6 h-3.5 rounded-sm ${c}`} />
          <span className="text-xs text-[#1A1A1A]">{l}</span>
        </div>
      ))}
    </div>
  )
}

function DayGlance({ booked, total, openSlots, utilization }: { booked: number; total: number; openSlots: number; utilization: number }) {
  return (
    <div className="bg-white rounded-[10px] border border-[#0F3D2E]/10 px-4 py-4">
      <p className="font-mono text-[10.5px] tracking-[0.12em] uppercase text-[#6B7770] font-semibold mb-3">Day at a glance</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="font-display text-2xl text-[#0F3D2E] leading-none tracking-[-0.02em]" style={{ fontWeight: 400 }}>{utilization}%</p>
          <p className="text-[10.5px] text-[#6B7770] mt-1.5">Booked</p>
        </div>
        <div>
          <p className="font-display text-2xl text-[#0F3D2E] leading-none tracking-[-0.02em]" style={{ fontWeight: 400 }}>{booked}/{total}</p>
          <p className="text-[10.5px] text-[#6B7770] mt-1.5">Slots filled</p>
        </div>
        <div>
          <p className="font-display text-2xl text-[#0F3D2E] leading-none tracking-[-0.02em]" style={{ fontWeight: 400 }}>{openSlots}</p>
          <p className="text-[10.5px] text-[#6B7770] mt-1.5">Open seats</p>
        </div>
      </div>
    </div>
  )
}

function QuickActionCard({ openSlots }: { openSlots: number }) {
  return (
    <div className="bg-[#082419] rounded-[10px] px-4 py-4 text-[#F4F1EA]">
      <p className="font-mono text-[10.5px] tracking-[0.12em] uppercase text-[#E0A800] font-semibold mb-2">Quick action</p>
      <p className="text-[13px] leading-snug mb-3">
        {openSlots} open {openSlots === 1 ? 'seat' : 'seats'} today. Notify the waitlist?
      </p>
      <button
        type="button"
        disabled
        className="w-full px-3 py-2 bg-[#E0A800] text-[#082419] rounded text-[12.5px] font-semibold opacity-60 cursor-not-allowed"
        title="Coming soon"
      >
        Notify waitlisted (coming soon)
      </button>
    </div>
  )
}
