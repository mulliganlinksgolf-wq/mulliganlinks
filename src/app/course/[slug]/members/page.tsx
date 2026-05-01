import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import CsvExportButton from '@/components/reports/CsvExportButton'

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
      user_id, total_paid, status,
      tee_times!inner(course_id),
      profiles_with_email!inner(full_name, phone, email),
      memberships:profiles(memberships(tier, status))
    `)
    .eq('tee_times.course_id', course.id)
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false })

  const memberMap = new Map<string, {
    user_id: string
    full_name: string
    email: string
    phone: string
    tier: string
    total_spent: number
    rounds: number
  }>()

  for (const b of bookings ?? []) {
    const p = b.profiles_with_email as any
    const existing = memberMap.get(b.user_id)
    if (existing) {
      existing.total_spent += b.total_paid ?? 0
      existing.rounds += 1
    } else {
      memberMap.set(b.user_id, {
        user_id: b.user_id,
        full_name: p?.full_name ?? '—',
        email: p?.email ?? '—',
        phone: p?.phone ?? '—',
        tier: (b as any)?.memberships?.[0]?.tier ?? 'free',
        total_spent: b.total_paid ?? 0,
        rounds: 1,
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

  const tierBadge: Record<string, string> = {
    free: 'bg-gray-100 text-gray-600',
    eagle: 'bg-[#E0A800]/20 text-[#92700a]',
    ace: 'bg-[#1B4332]/10 text-[#1B4332]',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A]">Members</h1>
          <p className="text-sm text-[#6B7770]">{uniqueMembers.length} unique members</p>
        </div>
        <CsvExportButton data={csvData} filename={`${slug}-members.csv`} />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[#6B7770] uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[#6B7770] uppercase tracking-wide">Email</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[#6B7770] uppercase tracking-wide">Tier</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[#6B7770] uppercase tracking-wide">Rounds</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[#6B7770] uppercase tracking-wide">Total Spent</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[#6B7770] uppercase tracking-wide">Phone</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {uniqueMembers.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[#6B7770]">No confirmed bookings yet.</td></tr>
            ) : uniqueMembers.map(m => (
              <tr key={m.user_id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-medium text-[#1A1A1A]">{m.full_name}</td>
                <td className="px-4 py-2.5 text-[#6B7770]">{m.email}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${tierBadge[m.tier] ?? tierBadge.free}`}>
                    {m.tier === 'free' ? 'Fairway' : m.tier.charAt(0).toUpperCase() + m.tier.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-[#6B7770]">{m.rounds}</td>
                <td className="px-4 py-2.5 font-medium text-[#1A1A1A]">${m.total_spent.toFixed(2)}</td>
                <td className="px-4 py-2.5 text-[#6B7770]">{m.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
