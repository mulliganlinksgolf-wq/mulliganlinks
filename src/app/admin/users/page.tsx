import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CreateMemberModal } from '@/components/admin/CreateMemberModal'
import { UserActions } from '@/components/admin/UserActions'
import MemberListFilters from '@/components/admin/MemberListFilters'

export const metadata = { title: 'Users' }

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { q, tier, status, founding } = await searchParams

  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user: me } } = await supabase.auth.getUser()

  const [{ data: waitlist }, { data: golferWaitlist }] = await Promise.all([
    admin.from('waitlist').select('*').order('created_at', { ascending: false }),
    admin.from('golfer_waitlist').select('id, email, first_name, last_name, created_at').order('created_at', { ascending: false }),
  ])

  // Merge: prefer golfer_waitlist entries (they have name data); dedupe by email
  const golferEmails = new Set((golferWaitlist ?? []).map((g: any) => g.email))
  const combinedWaitlist = [
    ...(golferWaitlist ?? []).map((g: any) => ({
      id: `gw-${g.id}`,
      email: g.email,
      name: [g.first_name, g.last_name].filter(Boolean).join(' ') || null,
      created_at: g.created_at,
    })),
    ...(waitlist ?? [])
      .filter((w: any) => !golferEmails.has(w.email))
      .map((w: any) => ({ id: `w-${w.id}`, email: w.email, name: null, created_at: w.created_at })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  // profiles has no email column — email lives in auth.users
  const [profilesResult, { data: { users: authUsers } }] = await Promise.all([
    admin
      .from('profiles')
      .select('id, full_name, phone, is_admin, founding_member, created_at, memberships(tier, status)')
      .order('created_at', { ascending: false }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ])

  // Build email lookup from auth
  const emailMap = Object.fromEntries((authUsers ?? []).map(u => [u.id, u.email ?? '']))

  // Merge email into profiles and apply filters
  const searchQuery = typeof q === 'string' ? q.toLowerCase() : ''
  const tierFilter = typeof tier === 'string' ? tier : ''
  const statusFilter = typeof status === 'string' ? status : ''
  const foundingFilter = founding === 'true'

  const members = (profilesResult.data ?? [])
    .map(p => ({
      ...p,
      email: emailMap[p.id] ?? '',
    }))
    .filter(m => {
      const membership = Array.isArray(m.memberships) ? m.memberships[0] : m.memberships

      if (searchQuery) {
        const nameMatch = (m.full_name ?? '').toLowerCase().includes(searchQuery)
        const emailMatch = m.email.toLowerCase().includes(searchQuery)
        if (!nameMatch && !emailMatch) return false
      }

      // 'fairway' is the display label for members with no paid membership
      const effectiveTier = membership?.tier ?? 'fairway'
      if (tierFilter && effectiveTier !== tierFilter) return false

      if (statusFilter && membership?.status !== statusFilter) return false

      if (foundingFilter && !m.founding_member) return false

      return true
    })

  const tierColor: Record<string, string> = {
    ace: 'bg-[#1B4332] text-[#FAF7F2]',
    eagle: 'bg-[#E0A800] text-[#1A1A1A]',
    fairway: 'bg-[#FAF7F2] text-[#1A1A1A] ring-1 ring-black/10',
  }

  const statusColor: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700',
    canceled: 'bg-red-50 text-red-700',
    past_due: 'bg-amber-50 text-amber-700',
  }

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Users</h1>
          <p className="text-[#6B7770] text-sm mt-1">Manage members, tiers, and admin access</p>
        </div>
        <CreateMemberModal />
      </div>

      {/* Registered members */}
      <section>
        <h2 className="text-lg font-bold text-[#1A1A1A] mb-4">
          Registered members <span className="text-[#6B7770] font-normal text-sm ml-1">({members.length})</span>
        </h2>
        <Suspense fallback={null}>
          <MemberListFilters />
        </Suspense>
        <div className="bg-white rounded-xl ring-1 ring-black/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#FAF7F2] text-[#6B7770] border-b border-black/5">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Name</th>
                  <th className="text-left px-5 py-3 font-medium">Email</th>
                  <th className="text-left px-5 py-3 font-medium">Tier</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium">Founding</th>
                  <th className="text-left px-5 py-3 font-medium">Joined</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {members.length > 0 ? members.map((m: any) => {
                  const membership = Array.isArray(m.memberships) ? m.memberships[0] : m.memberships
                  const tier = membership?.tier ?? 'fairway'
                  const memberStatus = membership?.status ?? 'active'
                  const isSelf = m.id === me?.id
                  return (
                    <tr key={m.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-[#1A1A1A]">
                        <div className="flex items-center gap-2">
                          <Link href={'/admin/users/' + m.id} className="hover:underline">
                            {m.full_name || '—'}
                          </Link>
                          {m.is_admin && !isSelf && (
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#1B4332] bg-[#1B4332]/10 rounded px-1.5 py-0.5">admin</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[#6B7770]">{m.email || '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${tierColor[tier] ?? tierColor.fairway}`}>
                          {tier}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusColor[memberStatus] ?? 'bg-gray-50 text-gray-700'}`}>
                          {memberStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[#6B7770] text-xs">
                        {m.founding_member ? '★ Founding' : '—'}
                      </td>
                      <td className="px-5 py-3 text-[#6B7770]">
                        {new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <UserActions
                        userId={m.id}
                        currentTier={tier}
                        isAdmin={!!m.is_admin}
                        isSelf={isSelf}
                      />
                    </tr>
                  )
                }) : (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-[#6B7770]">No members found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <section>
        <h2 className="text-lg font-bold text-[#1A1A1A] mb-4">
          Waitlist <span className="text-[#6B7770] font-normal text-sm ml-1">({combinedWaitlist.length})</span>
        </h2>
        <div className="bg-white rounded-xl ring-1 ring-black/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#FAF7F2] text-[#6B7770] border-b border-black/5">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Name</th>
                  <th className="text-left px-5 py-3 font-medium">Email</th>
                  <th className="text-left px-5 py-3 font-medium">Signed up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {combinedWaitlist.length > 0 ? combinedWaitlist.map((w) => (
                  <tr key={w.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                    <td className="px-5 py-3 text-[#1A1A1A]">{w.name ?? <span className="text-[#6B7770] italic">—</span>}</td>
                    <td className="px-5 py-3 text-[#6B7770]">{w.email}</td>
                    <td className="px-5 py-3 text-[#6B7770]">
                      {new Date(w.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={3} className="px-5 py-8 text-center text-[#6B7770]">No waitlist signups yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
