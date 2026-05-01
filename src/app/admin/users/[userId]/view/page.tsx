import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ImpersonateButton from './ImpersonateButton'

const tierLabels: Record<string, { label: string; color: string }> = {
  free:   { label: 'Fairway', color: 'bg-[#8FA889]/20 text-[#1B4332]' },
  eagle:  { label: 'Eagle',   color: 'bg-[#E0A800]/20 text-[#92700a]' },
  ace:    { label: 'Ace',     color: 'bg-[#1B4332]/10 text-[#1B4332]' },
}

export default async function ViewAsMemberPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const admin = createAdminClient()

  const [
    { data: profile },
    { data: user, error: userError },
    { data: membership },
    { data: pointsData },
    { data: bookings },
    { data: pointsLog },
  ] = await Promise.all([
    admin.from('profiles').select('full_name, email, created_at').eq('id', userId).single(),
    admin.auth.admin.getUserById(userId),
    admin.from('memberships').select('tier, status, current_period_end').eq('user_id', userId).eq('status', 'active').maybeSingle(),
    admin.from('fairway_points').select('amount').eq('user_id', userId),
    admin.from('bookings')
      .select('id, total_paid, status, players, created_at, tee_times(scheduled_at, courses(name))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
    admin.from('fairway_points')
      .select('amount, reason, created_at, courses(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  if (userError || !user.user) notFound()

  const email = user.user.email ?? profile?.email ?? '—'
  const fullName = profile?.full_name ?? email
  const firstName = fullName.split(' ')[0]
  const tier = membership?.tier ?? 'free'
  const tierInfo = tierLabels[tier] ?? tierLabels.free
  const pointsBalance = (pointsData ?? []).reduce((s, r) => s + r.amount, 0)
  const confirmedBookings = (bookings ?? []).filter(b => b.status !== 'canceled')

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Admin banner */}
      <div className="bg-amber-50 border border-amber-300 rounded-xl px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-amber-600 font-bold text-sm">Admin View</span>
          <span className="text-amber-700 text-sm">You are viewing the account of <strong>{fullName}</strong> ({email})</span>
        </div>
        <div className="flex items-center gap-3">
          <ImpersonateButton userId={userId} />
          <Link href="/admin/users" className="text-xs text-amber-600 hover:text-amber-800 font-medium underline">
            ← Back to users
          </Link>
        </div>
      </div>

      {/* Member header — exactly as they see it */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Hey, {firstName} 👋</h1>
          <p className="text-[#6B7770] mt-1">Here&apos;s your round report.</p>
        </div>
        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${tierInfo.color}`}>
          {tierInfo.label} Member
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#6B7770]">Fairway Points</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#1B4332]">{pointsBalance.toLocaleString()}</p>
            <p className="text-xs text-[#6B7770] mt-1">pts available</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#6B7770]">Membership</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#1A1A1A]">{tierInfo.label}</p>
            <p className="text-xs text-[#6B7770] mt-1">
              {membership?.current_period_end
                ? `Renews ${new Date(membership.current_period_end).toLocaleDateString()}`
                : 'Free plan'}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#6B7770]">Rounds Booked</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#1A1A1A]">{confirmedBookings.length}</p>
            <p className="text-xs text-[#6B7770] mt-1">total</p>
          </CardContent>
        </Card>
      </div>

      {/* Bookings */}
      <div>
        <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Bookings</h2>
        {!bookings || bookings.length === 0 ? (
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="py-12 text-center text-[#6B7770]">No bookings yet.</CardContent>
          </Card>
        ) : (
          <div className="bg-white rounded-xl ring-1 ring-black/5 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#FAF7F2] border-b border-black/5">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Course</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Tee time</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Players</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Paid</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {(bookings as any[]).map(b => (
                  <tr key={b.id} className="hover:bg-[#FAF7F2]/50">
                    <td className="px-4 py-3 font-medium text-[#1A1A1A]">{b.tee_times?.courses?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-[#6B7770]">
                      {b.tee_times?.scheduled_at
                        ? new Date(b.tee_times.scheduled_at).toLocaleDateString('en-US', {
                            weekday: 'short', month: 'short', day: 'numeric',
                            hour: 'numeric', minute: '2-digit', timeZone: 'America/Detroit',
                          })
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-[#6B7770]">{b.players}</td>
                    <td className="px-4 py-3 text-[#1A1A1A] font-medium">${Number(b.total_paid).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        b.status === 'completed' ? 'bg-[#8FA889]/20 text-[#1B4332]' :
                        'bg-red-100 text-red-700'
                      }`}>{b.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Points log */}
      <div>
        <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Points history</h2>
        {!pointsLog || pointsLog.length === 0 ? (
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="py-8 text-center text-[#6B7770]">No points yet.</CardContent>
          </Card>
        ) : (
          <div className="bg-white rounded-xl ring-1 ring-black/5 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#FAF7F2] border-b border-black/5">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Reason</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Course</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Date</th>
                  <th className="text-right px-4 py-3 font-medium text-[#6B7770]">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {(pointsLog as any[]).map(p => (
                  <tr key={p.id ?? p.created_at} className="hover:bg-[#FAF7F2]/50">
                    <td className="px-4 py-3 text-[#1A1A1A]">{p.reason}</td>
                    <td className="px-4 py-3 text-[#6B7770]">{p.courses?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-[#6B7770]">
                      {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${p.amount > 0 ? 'text-[#1B4332]' : 'text-red-600'}`}>
                      {p.amount > 0 ? '+' : ''}{p.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin-only info panel */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-2 text-sm">
        <p className="font-bold text-amber-800">Admin info (not visible to member)</p>
        <p className="text-amber-700">User ID: <code className="font-mono text-xs bg-amber-100 px-1 py-0.5 rounded">{userId}</code></p>
        <p className="text-amber-700">Email: {email}</p>
        <p className="text-amber-700">Joined: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}</p>
        <p className="text-amber-700">Auth provider: {user.user.app_metadata?.provider ?? 'email'}</p>
        <p className="text-amber-700">Last sign in: {user.user.last_sign_in_at ? new Date(user.user.last_sign_in_at).toLocaleString() : '—'}</p>
      </div>
    </div>
  )
}
