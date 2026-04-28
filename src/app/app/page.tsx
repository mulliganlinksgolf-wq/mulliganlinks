import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'

const tierLabels: Record<string, { label: string; color: string }> = {
  free: { label: 'Fairway', color: 'bg-[#8FA889]/20 text-[#1B4332]' },
  eagle: { label: 'Eagle', color: 'bg-[#E0A800]/20 text-[#92700a]' },
  ace: { label: 'Ace', color: 'bg-[#1B4332]/10 text-[#1B4332]' },
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  // Fetch active membership
  const { data: membership } = await supabase
    .from('memberships')
    .select('tier, status, current_period_end')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  // Fetch points balance
  const { data: pointsData } = await supabase
    .from('fairway_points')
    .select('amount')
    .eq('user_id', user.id)

  const pointsBalance = pointsData?.reduce((sum, row) => sum + (row.amount as number), 0) ?? 0

  // Fetch recent bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, total_paid, status, created_at, tee_times(scheduled_at, courses(name))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const tier = (membership?.tier as string) ?? 'free'
  const tierInfo = tierLabels[tier] ?? tierLabels.free
  const firstName = (profile?.full_name as string | null)?.split(' ')[0] ?? 'there'

  return (
    <div className="space-y-8">
      {/* Welcome */}
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
                ? `Renews ${new Date(membership.current_period_end as string).toLocaleDateString()}`
                : 'Free plan'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#6B7770]">Rounds Booked</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#1A1A1A]">{bookings?.length ?? 0}</p>
            <p className="text-xs text-[#6B7770] mt-1">total</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick action */}
      <div className="flex gap-3">
        <Link href="/app/courses" className={buttonVariants({ variant: 'default', className: 'bg-[#1B4332] hover:bg-[#1B4332]/90 text-[#FAF7F2]' })}>
          Book a tee time
        </Link>
        <Link href="/app/points" className={buttonVariants({ variant: 'outline' })}>
          View points
        </Link>
      </div>

      {/* Recent bookings */}
      <div>
        <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Recent bookings</h2>
        {!bookings || bookings.length === 0 ? (
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <p className="text-[#6B7770]">No bookings yet.</p>
              <Link href="/app/courses" className={buttonVariants({ variant: 'default', className: 'mt-4 bg-[#1B4332] hover:bg-[#1B4332]/90 text-[#FAF7F2]' })}>
                Find a course
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(bookings as any[]).map((b) => (
              <Card key={b.id} className="bg-white border-0 shadow-sm">
                <CardContent className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#1A1A1A]">
                      {b.tee_times?.courses?.name ?? 'Course'}
                    </p>
                    <p className="text-sm text-[#6B7770]">
                      {new Date(b.tee_times?.scheduled_at).toLocaleDateString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#1A1A1A]">${(b.total_paid as number).toFixed(2)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      b.status === 'completed' ? 'bg-[#8FA889]/20 text-[#1B4332]' :
                      'bg-red-100 text-red-700'
                    }`}>{b.status}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Upgrade nudge for free tier */}
      {tier === 'free' && (
        <Card className="bg-[#1B4332] border-0 shadow-sm text-[#FAF7F2]">
          <CardContent className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-lg">Upgrade to Eagle</p>
              <p className="text-[#FAF7F2]/80 text-sm">Get $120 in credits and 1.5× points for $79/yr.</p>
            </div>
            <Link href="/app/membership" className={buttonVariants({ variant: 'default', className: 'bg-[#E0A800] hover:bg-[#E0A800]/90 text-[#1A1A1A] font-semibold shrink-0' })}>
              Upgrade now
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
