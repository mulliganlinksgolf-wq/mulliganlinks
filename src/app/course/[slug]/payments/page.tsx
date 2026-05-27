import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { stripe } from '@/lib/stripe'
import { requireManager } from '@/lib/courseRole'

export default async function CoursePaymentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ stripe?: string }>
}) {
  const { slug } = await params
  await requireManager(slug)
  const { stripe: stripeParam } = await searchParams
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: course } = await admin
    .from('courses')
    .select('id, name, slug, stripe_account_id, stripe_account_status, stripe_charges_enabled, stripe_payouts_enabled, stripe_details_submitted')
    .eq('slug', slug)
    .single()

  if (!course) notFound()

  // Recent bookings with payment info
  const { data: recentBookings } = await admin
    .from('bookings')
    .select('id, players, total_charged_cents, platform_fee_cents, payment_status, paid_at, created_at, profiles(full_name), tee_times!inner(scheduled_at, course_id)')
    .eq('tee_times.course_id', course.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Recent payouts
  const { data: payouts } = await admin
    .from('course_payouts')
    .select('id, amount_cents, arrival_date, status, created_at')
    .eq('course_id', course.id)
    .order('arrival_date', { ascending: false })
    .limit(10)

  // Open disputes
  const { data: disputes } = await admin
    .from('payment_disputes')
    .select('id, amount_cents, reason, status, evidence_due_by, created_at')
    .eq('course_id', course.id)
    .not('status', 'eq', 'won')
    .order('created_at', { ascending: false })

  // Generate Stripe Express dashboard login link if account is active
  let stripeDashboardUrl: string | null = null
  if (course.stripe_account_id && course.stripe_charges_enabled) {
    try {
      const link = await stripe.accounts.createLoginLink(course.stripe_account_id)
      stripeDashboardUrl = link.url
    } catch {
      // Not yet eligible for login link
    }
  }

  const isActive = course.stripe_charges_enabled && course.stripe_payouts_enabled
  const needsOnboarding = !course.stripe_account_id || course.stripe_account_status === 'not_started'
  const isOnboarding = course.stripe_account_status === 'onboarding' || course.stripe_account_status === 'restricted'

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Payments</h1>
        {stripeDashboardUrl && (
          <a
            href={stripeDashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#1B4332] underline"
          >
            Open Stripe dashboard ↗
          </a>
        )}
      </div>

      {/* Stripe account status banner */}
      {stripeParam === 'return' && isActive && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4">
          <p className="font-semibold text-green-800">You&apos;re live on Stripe!</p>
          <p className="text-sm text-green-700 mt-1">Your account is verified and ready to accept payments.</p>
        </div>
      )}

      {needsOnboarding && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl px-5 py-5 space-y-3">
          <p className="font-semibold text-amber-800">Set up payouts to receive your green fees</p>
          <p className="text-sm text-amber-700">Connect your bank account through Stripe to start accepting bookings and receiving payouts.</p>
          <form action={`/api/courses/${course.id}/stripe/onboard`} method="POST">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#1B4332] text-[#FAF7F2] text-sm font-semibold rounded-lg hover:bg-[#1B4332]/90 transition-colors"
            >
              Connect bank account →
            </button>
          </form>
        </div>
      )}

      {isOnboarding && !needsOnboarding && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl px-5 py-5 space-y-3">
          <p className="font-semibold text-amber-800">Almost there — Stripe needs a few more details</p>
          <p className="text-sm text-amber-700">
            Your account status: <strong>{course.stripe_account_status}</strong>. Complete your Stripe setup to start accepting payments.
          </p>
          <form action={`/api/courses/${course.id}/stripe/onboard`} method="POST">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#1B4332] text-[#FAF7F2] text-sm font-semibold rounded-lg hover:bg-[#1B4332]/90 transition-colors"
            >
              Continue setup →
            </button>
          </form>
        </div>
      )}

      {/* Open disputes */}
      {disputes && disputes.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 space-y-3">
          <p className="font-semibold text-red-800">Open disputes ({disputes.length})</p>
          {disputes.map((d: any) => (
            <div key={d.id} className="flex items-center justify-between text-sm">
              <div>
                <p className="text-red-700 font-medium">${(d.amount_cents / 100).toFixed(2)} — {d.reason ?? 'unknown reason'}</p>
                {d.evidence_due_by && (
                  <p className="text-red-600 text-xs mt-0.5">
                    Evidence due by {new Date(d.evidence_due_by).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                )}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                d.status === 'needs_response' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
              }`}>{d.status}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent bookings */}
        <div>
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Recent bookings</h2>
          {!recentBookings || recentBookings.length === 0 ? (
            <p className="text-sm text-[#6B7770]">No bookings yet.</p>
          ) : (
            <div className="bg-white rounded-xl ring-1 ring-black/5 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#FAF7F2] border-b border-black/5">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Member</th>
                    <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Your payout</th>
                    <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {(recentBookings as any[]).map(b => {
                    const total = b.total_charged_cents ?? 0
                    const platform = b.platform_fee_cents ?? 0
                    const coursePayout = (total - platform) / 100
                    return (
                      <tr key={b.id} className="hover:bg-[#FAF7F2]/50">
                        <td className="px-4 py-3 font-medium text-[#1A1A1A]">{b.profiles?.full_name ?? 'Member'}</td>
                        <td className="px-4 py-3">
                          <div className="text-[#1B4332] font-semibold">${coursePayout.toFixed(2)}</div>
                          {platform > 0 && (
                            <div className="text-xs text-[#6B7770]">${(platform / 100).toFixed(2)} platform fee</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            b.payment_status === 'succeeded' ? 'bg-green-100 text-green-700' :
                            b.payment_status === 'refunded' ? 'bg-gray-100 text-gray-600' :
                            b.payment_status === 'failed' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>{b.payment_status}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent payouts */}
        <div>
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Recent payouts</h2>
          {!payouts || payouts.length === 0 ? (
            <p className="text-sm text-[#6B7770]">No payouts yet — payouts begin 7 days after a booking.</p>
          ) : (
            <div className="bg-white rounded-xl ring-1 ring-black/5 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#FAF7F2] border-b border-black/5">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Amount</th>
                    <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {(payouts as any[]).map(p => (
                    <tr key={p.id} className="hover:bg-[#FAF7F2]/50">
                      <td className="px-4 py-3 text-[#6B7770]">
                        {new Date(p.arrival_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#1A1A1A]">${(p.amount_cents / 100).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>{p.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
