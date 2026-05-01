import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import CsvExportButton from '@/components/reports/CsvExportButton'

export default async function CourseBillingPage({
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
    .select('id, name, slug, legal_entity_name, billing_email, created_at, status')
    .eq('slug', slug)
    .single()
  if (courseError && courseError.code !== 'PGRST116') throw new Error(`[CourseBillingPage] ${courseError.message}`)
  if (!course) notFound()

  const { data: payouts } = await admin
    .from('course_payouts')
    .select('id, amount_cents, arrival_date, status, created_at')
    .eq('course_id', course.id)
    .order('arrival_date', { ascending: false })
    .limit(50)

  const csvData = (payouts ?? []).map(p => ({
    'Arrival Date': p.arrival_date,
    'Amount': `$${(p.amount_cents / 100).toFixed(2)}`,
    'Status': p.status,
  }))

  const contractStart = new Date(course.created_at).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  const statusColor: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-800',
    inactive: 'bg-gray-100 text-gray-600',
    suspended: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-[#1A1A1A]">Billing &amp; Contract</h1>

      {/* Plan card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-widest text-[#6B7770]">Current Plan</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl font-bold text-[#1A1A1A]">TeeAhead Partner</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[course.status] ?? statusColor.active}`}>
                {course.status ?? 'active'}
              </span>
            </div>
            <p className="text-[#6B7770] text-sm">$349 / month · Billed monthly</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-[#6B7770]">Partner since</p>
            <p className="text-sm font-medium text-[#1A1A1A]">{contractStart}</p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-[#6B7770] mb-0.5">Legal entity</p>
            <p className="text-[#1A1A1A] font-medium">{course.legal_entity_name || course.name}</p>
          </div>
          <div>
            <p className="text-xs text-[#6B7770] mb-0.5">Billing email</p>
            <p className="text-[#1A1A1A] font-medium">{course.billing_email || '—'}</p>
          </div>
        </div>

        <div className="text-sm text-[#6B7770]">
          To change your plan or discuss your contract, contact us at{' '}
          <a href="mailto:partnerships@teeahead.com" className="text-[#1B4332] underline hover:no-underline">
            partnerships@teeahead.com
          </a>
        </div>
      </div>

      {/* Contract */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        <div className="px-6 py-4">
          <h2 className="font-semibold text-[#1A1A1A]">TeeAhead Partner Agreement</h2>
          <p className="text-sm text-[#6B7770] mt-0.5">Key terms of your partnership</p>
        </div>
        <div className="px-6 py-5 space-y-4 text-sm text-[#3a3a3a]">
          {[
            ['Platform fee', '$349/month, billed monthly. No setup fee.'],
            ['Booking fee', 'TeeAhead collects 0% — you keep 100% of green fees.'],
            ['Tee sheet access', 'Full tee sheet management, real-time availability, waitlist automation.'],
            ['Fairway Points', 'Auto-awarded at 1pt per dollar. Redeemable at your course.'],
            ['Cancellation', '30-day written notice to partnerships@teeahead.com. No early-termination fee.'],
            ['Data ownership', 'All booking, member, and revenue data remains yours. Exportable at any time.'],
          ].map(([term, detail]) => (
            <div key={term} className="flex gap-4">
              <span className="w-36 shrink-0 font-medium text-[#1A1A1A]">{term}</span>
              <span className="text-[#6B7770]">{detail}</span>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 text-xs text-[#6B7770]">
          Agreement effective {contractStart}. For the full signed agreement, email{' '}
          <a href="mailto:partnerships@teeahead.com" className="text-[#1B4332] underline">
            partnerships@teeahead.com
          </a>
        </div>
      </div>

      {/* Payout history */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-[#1A1A1A]">Payout History</h2>
            <p className="text-xs text-[#6B7770] mt-0.5">Payments from TeeAhead to your account</p>
          </div>
          <CsvExportButton data={csvData} filename={`${slug}-payouts.csv`} />
        </div>
        {(payouts ?? []).length === 0 ? (
          <div className="px-6 py-10 text-center text-[#6B7770] text-sm">
            No payouts yet. Payouts will appear here once Stripe processing is active.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Arrival Date', 'Amount', 'Status'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-medium text-[#6B7770] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(payouts ?? []).map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-[#1A1A1A]">
                    {new Date(p.arrival_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-3 font-medium text-[#1A1A1A]">${(p.amount_cents / 100).toFixed(2)}</td>
                  <td className="px-6 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      p.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                      p.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
