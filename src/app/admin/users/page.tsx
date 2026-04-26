import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CreateMemberModal } from '@/components/admin/CreateMemberModal'
import { UserActions } from '@/components/admin/UserActions'

export const metadata = { title: 'Users' }

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user: me } } = await supabase.auth.getUser()

  // Fetch members — try with is_admin first, fall back without if column not yet in schema cache
  const { data: waitlist } = await admin
    .from('waitlist').select('*').order('created_at', { ascending: false })

  let members: any[] | null = null
  const withAdmin = await admin
    .from('profiles')
    .select('id, full_name, email, is_admin, created_at, memberships(tier, status)')
    .order('created_at', { ascending: false })

  if (!withAdmin.error) {
    members = withAdmin.data
  } else {
    // Schema cache may not include is_admin yet — retry without it
    const fallback = await admin
      .from('profiles')
      .select('id, full_name, email, created_at, memberships(tier, status)')
      .order('created_at', { ascending: false })
    members = fallback.data
  }

  const tierColor: Record<string, string> = {
    ace: 'bg-[#1B4332] text-[#FAF7F2]',
    eagle: 'bg-[#E0A800] text-[#1A1A1A]',
    fairway: 'bg-[#FAF7F2] text-[#1A1A1A] ring-1 ring-black/10',
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
          Registered members <span className="text-[#6B7770] font-normal text-sm ml-1">({members?.length ?? 0})</span>
        </h2>
        <div className="bg-white rounded-xl ring-1 ring-black/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#FAF7F2] text-[#6B7770] border-b border-black/5">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Name</th>
                  <th className="text-left px-5 py-3 font-medium">Email</th>
                  <th className="text-left px-5 py-3 font-medium">Tier</th>
                  <th className="text-left px-5 py-3 font-medium">Joined</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {members && members.length > 0 ? members.map((m: any) => {
                  const membership = Array.isArray(m.memberships) ? m.memberships[0] : m.memberships
                  const tier = membership?.tier ?? 'fairway'
                  const isSelf = m.id === me?.id
                  return (
                    <tr key={m.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-[#1A1A1A]">
                        <div className="flex items-center gap-2">
                          {m.full_name || '—'}
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
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-[#6B7770]">No members yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <section>
        <h2 className="text-lg font-bold text-[#1A1A1A] mb-4">
          Waitlist <span className="text-[#6B7770] font-normal text-sm ml-1">({waitlist?.length ?? 0})</span>
        </h2>
        <div className="bg-white rounded-xl ring-1 ring-black/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#FAF7F2] text-[#6B7770] border-b border-black/5">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Email</th>
                  <th className="text-left px-5 py-3 font-medium">Signed up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {waitlist && waitlist.length > 0 ? waitlist.map((w: any) => (
                  <tr key={w.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                    <td className="px-5 py-3 text-[#1A1A1A]">{w.email}</td>
                    <td className="px-5 py-3 text-[#6B7770]">
                      {new Date(w.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={2} className="px-5 py-8 text-center text-[#6B7770]">No waitlist signups yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
