import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

export const metadata = { title: 'Admin Dashboard' }

export default async function AdminDashboardPage() {
  const admin = createAdminClient()

  const [
    { count: waitlistCount },
    { count: memberCount },
    { count: courseCount },
    { count: bookingCount },
    { data: recentMembers },
    { data: recentBookings },
  ] = await Promise.all([
    admin.from('golfer_waitlist').select('*', { count: 'exact', head: true }),
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('courses').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('bookings').select('*', { count: 'exact', head: true }).neq('status', 'canceled'),
    admin.from('profiles').select('id, full_name, created_at').order('created_at', { ascending: false }).limit(5),
    admin.from('bookings')
      .select('id, created_at, status, total_amount, profiles(full_name), tee_times(scheduled_at, courses(name))')
      .neq('status', 'canceled')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  // Get emails for recent members from auth
  const { data: { users: authUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const emailMap = Object.fromEntries((authUsers ?? []).map(u => [u.id, u.email ?? '']))

  const stats = [
    { label: 'Waitlist signups', value: waitlistCount ?? 0, href: '/admin/waitlist' },
    { label: 'Registered members', value: memberCount ?? 0, href: '/admin/users' },
    { label: 'Active courses', value: courseCount ?? 0, href: '/admin/courses' },
    { label: 'Total bookings', value: bookingCount ?? 0, href: null },
  ]

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Dashboard</h1>
        <p className="text-[#6B7770] text-sm mt-1">TeeAhead at a glance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-6 ring-1 ring-black/5">
            <p className="text-sm text-[#6B7770]">{s.label}</p>
            <p className="text-3xl font-bold mt-1 text-[#1B4332]">{s.value.toLocaleString()}</p>
            {s.href && (
              <Link href={s.href} className="text-xs text-[#1B4332] hover:underline mt-2 inline-block">
                View all →
              </Link>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent members */}
        <div className="bg-white rounded-xl ring-1 ring-black/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#1A1A1A]">Recent members</h2>
            <Link href="/admin/users" className="text-xs text-[#1B4332] hover:underline">View all</Link>
          </div>
          {recentMembers && recentMembers.length > 0 ? (
            <div className="space-y-3">
              {recentMembers.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-[#1A1A1A] font-medium">{m.full_name || '—'}</span>
                    <span className="text-[#6B7770] text-xs ml-2">{emailMap[m.id] ?? ''}</span>
                  </div>
                  <span className="text-[#6B7770] text-xs">
                    {new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#6B7770]">No members yet.</p>
          )}
        </div>

        {/* Recent bookings */}
        <div className="bg-white rounded-xl ring-1 ring-black/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#1A1A1A]">Recent bookings</h2>
          </div>
          {recentBookings && recentBookings.length > 0 ? (
            <div className="space-y-3">
              {recentBookings.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-[#1A1A1A] font-medium">{b.profiles?.full_name ?? 'Unknown'}</span>
                    <span className="text-[#6B7770] ml-2">{b.tee_times?.courses?.name}</span>
                  </div>
                  <span className="text-[#1B4332] font-semibold">${Number(b.total_amount).toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#6B7770]">No bookings yet.</p>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: '/admin/content', title: 'Edit site copy', body: 'Update homepage headlines, CTAs, and other copy.' },
          { href: '/admin/users', title: 'Manage users', body: 'View waitlist, registered members, and membership tiers.' },
          { href: '/admin/courses', title: 'Manage courses', body: 'Activate, deactivate, and review partner courses.' },
        ].map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="bg-white rounded-xl ring-1 ring-black/5 p-6 hover:ring-[#1B4332]/30 transition-all group"
          >
            <h3 className="font-bold text-[#1A1A1A] group-hover:text-[#1B4332] transition-colors">{c.title}</h3>
            <p className="text-sm text-[#6B7770] mt-1">{c.body}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
