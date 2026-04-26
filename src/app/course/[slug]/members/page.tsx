import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function CourseMembersPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: course } = await supabase
    .from('courses')
    .select('id, name')
    .eq('slug', slug)
    .single()
  if (!course) notFound()

  // Get unique members who have booked at this course, with their tier and spend
  const { data: members } = await supabase
    .from('bookings')
    .select(`
      user_id, total_paid, status,
      profiles!inner(full_name, phone),
      memberships:profiles(memberships(tier, status))
    `)
    .eq('tee_times.course_id', course.id)
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false })

  // Deduplicate by user_id and aggregate spend
  const memberMap = new Map<string, any>()
  for (const b of members ?? []) {
    const existing = memberMap.get(b.user_id)
    if (existing) {
      existing.total_spent += b.total_paid ?? 0
      existing.rounds += 1
    } else {
      memberMap.set(b.user_id, {
        user_id: b.user_id,
        full_name: (b.profiles as any)?.full_name ?? '—',
        phone: (b.profiles as any)?.phone ?? '—',
        tier: (b as any)?.memberships?.[0]?.tier ?? 'free',
        total_spent: b.total_paid ?? 0,
        rounds: 1,
      })
    }
  }
  const uniqueMembers = Array.from(memberMap.values())
    .sort((a, b) => b.total_spent - a.total_spent)

  const tierBadge: Record<string, string> = {
    free: 'bg-gray-100 text-gray-600',
    eagle: 'bg-[#E0A800]/20 text-[#92700a]',
    ace: 'bg-[#1B4332]/10 text-[#1B4332]',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#1A1A1A]">Members</h1>
        <span className="text-sm text-[#6B7770]">{uniqueMembers.length} unique members</span>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[#6B7770] uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[#6B7770] uppercase tracking-wide">Tier</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[#6B7770] uppercase tracking-wide">Rounds</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[#6B7770] uppercase tracking-wide">Total Spent</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[#6B7770] uppercase tracking-wide">Phone</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {uniqueMembers.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-[#6B7770]">No members have booked yet.</td></tr>
            ) : uniqueMembers.map(m => (
              <tr key={m.user_id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-medium text-[#1A1A1A]">{m.full_name}</td>
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
