import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import MemberDetailHeader from '@/components/admin/MemberDetailHeader'
import MemberDetailTabs from '@/components/admin/MemberDetailTabs'

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const admin = createAdminClient()
  const { data } = await admin.from('profiles').select('full_name').eq('id', userId).single()
  return { title: data?.full_name ? `${data.full_name} | Members` : 'Member Detail' }
}

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const admin = createAdminClient()

  const [
    profileResult,
    membershipResult,
    bookingsResult,
    creditsResult,
    pointsResult,
    notesResult,
    coursesResult,
    { data: { users: authUsers } },
  ] = await Promise.all([
    admin.from('profiles').select('id, full_name, email, phone, home_course_id, is_admin, founding_member, stripe_customer_id, created_at').eq('id', userId).single(),
    admin.from('memberships').select('id, tier, status, stripe_subscription_id, stripe_customer_id, current_period_end, cancel_at_period_end, created_at').eq('user_id', userId).single(),
    admin.from('bookings').select('id, created_at, paid_at, players, green_fee_cents, platform_fee_cents, total_charged_cents, payment_status, stripe_charge_id, status, tee_times(scheduled_at, courses(name))').eq('user_id', userId).order('created_at', { ascending: false }),
    admin.from('member_credits').select('id, type, amount_cents, status, period, expires_at, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
    admin.from('fairway_points').select('id, amount, reason, created_at, booking_id, courses(name)').eq('user_id', userId).order('created_at', { ascending: false }),
    admin.from('member_admin_notes').select('id, body, admin_email, created_at').eq('member_id', userId).order('created_at', { ascending: false }),
    admin.from('courses').select('id, name').eq('status', 'active').order('name'),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ])

  if (!profileResult.data) notFound()

  const emailMap = Object.fromEntries((authUsers ?? []).map((u: any) => [u.id, u.email ?? '']))
  const profile = { ...profileResult.data, email: profileResult.data.email ?? emailMap[userId] ?? '' }
  const membership = membershipResult.data ?? null
  const courses = coursesResult.data ?? []

  const bookings = (bookingsResult.data ?? []).map((b: any) => ({
    id: b.id,
    created_at: b.created_at,
    paid_at: b.paid_at,
    players: b.players,
    green_fee_cents: b.green_fee_cents,
    platform_fee_cents: b.platform_fee_cents,
    total_charged_cents: b.total_charged_cents,
    payment_status: b.payment_status,
    stripe_charge_id: b.stripe_charge_id,
    status: b.status,
    course_name: b.tee_times?.courses?.name ?? null,
    scheduled_at: b.tee_times?.scheduled_at ?? null,
  }))

  const points = (pointsResult.data ?? []).map((p: any) => ({
    id: p.id,
    amount: p.amount,
    reason: p.reason,
    created_at: p.created_at,
    booking_id: p.booking_id,
    course_name: (p.courses as any)?.name ?? null,
  }))

  return (
    <div className="space-y-6">
      <MemberDetailHeader
        userId={userId}
        fullName={profile.full_name}
        email={profile.email}
        joinDate={profile.created_at}
        tier={membership?.tier ?? null}
        status={membership?.status ?? null}
        isFoundingMember={profile.founding_member}
        periodEndDate={membership?.current_period_end ?? null}
        hasMembership={!!membership?.stripe_subscription_id}
      />
      <MemberDetailTabs
        userId={userId}
        profile={profile}
        membership={membership}
        bookings={bookings}
        credits={creditsResult.data ?? []}
        points={points}
        notes={notesResult.data ?? []}
        courses={courses}
        homeCourse={courses.find((c: any) => c.id === profile.home_course_id) ?? null}
      />
    </div>
  )
}
