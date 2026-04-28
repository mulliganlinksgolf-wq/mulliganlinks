import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { CheckInPanel } from '@/components/course/CheckInPanel'

export const metadata = { title: 'Member Check-in — TeeAhead' }

export default async function CheckInPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params

  // Must be a logged-in course admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminRows } = await supabase
    .from('course_admins')
    .select('course_id, courses(id, name, slug)')
    .eq('user_id', user.id)

  if (!adminRows || adminRows.length === 0) redirect('/')

  // Use first course if admin of one; show selector if multiple
  const courses = adminRows.map((r: any) => r.courses).filter(Boolean)

  // Load member info
  const admin = createAdminClient()
  const [{ data: profile }, { data: membership }, { data: pointRows }] = await Promise.all([
    admin.from('profiles').select('id, full_name, email').eq('id', userId).single(),
    admin.from('memberships').select('tier').eq('user_id', userId).eq('status', 'active').maybeSingle(),
    admin.from('fairway_points').select('amount').eq('user_id', userId),
  ])

  if (!profile) redirect('/')

  const balance = (pointRows ?? []).reduce((sum: number, r: any) => sum + r.amount, 0)
  const tier = membership?.tier ?? 'fairway'

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <p className="text-xs font-semibold text-[#6B7770] uppercase tracking-widest mb-1">TeeAhead Check-in</p>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">{profile.full_name ?? 'Member'}</h1>
          <p className="text-sm text-[#6B7770] mt-1">{profile.email}</p>
        </div>

        <CheckInPanel
          memberId={userId}
          memberName={profile.full_name ?? 'Member'}
          tier={tier}
          pointsBalance={balance}
          courses={courses}
        />
      </div>
    </div>
  )
}
