import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import CsvExportButton from '@/components/reports/CsvExportButton'
import { CoursePageHeader } from '@/components/course/CoursePageHeader'

export default async function CourseMembersPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/course/${slug}/login`)

  const admin = createAdminClient()
  const { data: course, error: courseError } = await admin
    .from('courses')
    .select('id, name')
    .eq('slug', slug)
    .single()
  if (courseError && courseError.code !== 'PGRST116') throw new Error(`[CourseMembersPage] course query failed: ${courseError.message}`)
  if (!course) notFound()

  const { data: bookings } = await admin
    .from('bookings')
    .select(`
      user_id, total_paid, status, created_at,
      tee_times!inner(course_id, scheduled_at),
      profiles_with_email!inner(full_name, phone, email),
      memberships:profiles(memberships(tier, status))
    `)
    .eq('tee_times.course_id', course.id)
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false })

  type MemberRow = {
    user_id: string
    full_name: string
    email: string
    phone: string
    tier: string
    total_spent: number
    rounds: number
    last_seen: Date | null
  }
  const memberMap = new Map<string, MemberRow>()

  for (const b of bookings ?? []) {
    const p = b.profiles_with_email as { full_name?: string; phone?: string; email?: string } | null
    const scheduledAt = ((b.tee_times as { scheduled_at?: string } | null)?.scheduled_at)
    const seenDate = scheduledAt ? new Date(scheduledAt) : null
    const existing = memberMap.get(b.user_id)
    if (existing) {
      existing.total_spent += b.total_paid ?? 0
      existing.rounds += 1
      if (seenDate && (!existing.last_seen || seenDate > existing.last_seen)) existing.last_seen = seenDate
    } else {
      memberMap.set(b.user_id, {
        user_id: b.user_id,
        full_name: p?.full_name ?? '—',
        email: p?.email ?? '—',
        phone: p?.phone ?? '—',
        tier: (b as { memberships?: Array<{ tier?: string }> })?.memberships?.[0]?.tier ?? 'free',
        total_spent: b.total_paid ?? 0,
        rounds: 1,
        last_seen: seenDate,
      })
    }
  }

  const uniqueMembers = Array.from(memberMap.values())
    .sort((a, b) => b.total_spent - a.total_spent)

  const csvData = uniqueMembers.map(m => ({
    Name: m.full_name,
    Email: m.email,
    Phone: m.phone,
    Tier: m.tier === 'free' ? 'Fairway' : m.tier.charAt(0).toUpperCase() + m.tier.slice(1),
    Rounds: m.rounds,
    'Total Spent': m.total_spent.toFixed(2),
  }))

  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const activeCount = uniqueMembers.filter(m => m.last_seen && m.last_seen >= thirtyDaysAgo).length
  const today = new Date(); today.setHours(0, 0, 0, 0)

  const lastSeenLabel = (d: Date | null) => {
    if (!d) return '—'
    const days = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (days <= 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days}d ago`
    if (days < 30) return `${Math.floor(days / 7)}w ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <>
      <CoursePageHeader
        title="Your members"
        subtitle={`${uniqueMembers.length} golfers · ${activeCount} active in last 30 days · Your data, owned by you.`}
        action={
          <CsvExportButton data={csvData} filename={`${slug}-members.csv`} />
        }
      />

      <div className="flex-1 p-6 overflow-y-auto">
        {uniqueMembers.length === 0 ? (
          <div className="bg-white rounded-[10px] border border-[#0F3D2E]/10 p-12 text-center">
            <p className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-[#6B7770] font-semibold mb-3">No members yet</p>
            <p className="text-sm text-[#6B7770]">Your members will show here as soon as bookings start coming in.</p>
          </div>
        ) : (
          <div className="bg-white rounded-[10px] border border-[#0F3D2E]/10 overflow-hidden">
            <div className="grid grid-cols-[2fr_90px_70px_110px_90px_110px] px-5 py-3.5 bg-[#0F3D2E]/[0.06] font-mono text-[10.5px] tracking-[0.1em] uppercase text-[#6B7770] font-semibold">
              <span>Member</span>
              <span>Tier</span>
              <span className="text-right">Rounds</span>
              <span className="text-right">YTD spend</span>
              <span className="text-right">Last seen</span>
              <span>Contact</span>
            </div>
            {uniqueMembers.map((m, i) => {
              const initials = m.full_name.split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase() || '?'
              const tierLabel = m.tier === 'free' ? 'Fairway' : m.tier.charAt(0).toUpperCase() + m.tier.slice(1)
              const isGoldTier = m.tier === 'eagle' || m.tier === 'ace'
              const isToday = m.last_seen && m.last_seen >= today
              return (
                <div
                  key={m.user_id}
                  className={`grid grid-cols-[2fr_90px_70px_110px_90px_110px] px-5 py-3.5 border-t border-[#0F3D2E]/10 items-center ${i % 2 === 1 ? 'bg-[#FAF7F2]/60' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-7 rounded-full bg-[#0F3D2E]/[0.06] text-[#0F3D2E] font-display text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium text-[#1A1A1A] truncate">{m.full_name}</div>
                      <div className="text-[11px] text-[#6B7770] truncate">{m.email}</div>
                    </div>
                  </div>
                  <span className={`font-mono text-[10.5px] tracking-[0.1em] uppercase font-semibold ${isGoldTier ? 'text-[#E0A800]' : 'text-[#6B7770]'}`}>
                    {tierLabel}
                  </span>
                  <span className="font-mono text-[13px] text-[#1A1A1A] text-right">{m.rounds}</span>
                  <span className="font-mono text-[13px] font-semibold text-[#0F3D2E] text-right">${m.total_spent.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  <span className={`text-xs text-right ${isToday ? 'text-[#0F3D2E] font-semibold' : 'text-[#6B7770]'}`}>{lastSeenLabel(m.last_seen)}</span>
                  <span className="text-xs text-[#6B7770] truncate">{m.phone}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
