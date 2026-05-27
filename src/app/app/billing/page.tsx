import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import CsvExportButton from '@/components/reports/CsvExportButton'
import MembershipActions from './MembershipActions'

const TIER_LABELS: Record<string, string> = {
  free: 'Fairway (Free)',
  eagle: 'Eagle',
  ace: 'Ace',
}

const TIER_PRICE: Record<string, string> = {
  free: 'Free',
  eagle: '$89 / year',
  ace: '$159 / year',
}

const TIER_COLOR: Record<string, string> = {
  free: 'bg-gray-100 text-gray-600',
  eagle: 'bg-[#E0A800]/20 text-[#92700a]',
  ace: 'bg-[#1B4332]/10 text-[#1B4332]',
}

export default async function MemberBillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const [{ data: membership }, { data: bookings }] = await Promise.all([
    admin
      .from('memberships')
      .select('tier, status, current_period_end, cancel_at_period_end, canceled_at, created_at, paused_until')
      .eq('user_id', user.id)
      .maybeSingle(),
    admin
      .from('bookings')
      .select(`
        id, created_at, total_paid, status,
        tee_times!inner(scheduled_at, courses!inner(name))
      `)
      .eq('user_id', user.id)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const tier = membership?.tier ?? 'free'
  const now = new Date()
  const isPaused = !!membership?.paused_until && new Date(membership.paused_until) > now
  const isCancelPending = membership?.cancel_at_period_end === true

  const csvData = (bookings ?? []).map(b => ({
    Date: new Date(b.created_at).toLocaleDateString('en-US'),
    Course: (b.tee_times as any)?.courses?.name ?? '—',
    'Tee Time': new Date((b.tee_times as any)?.scheduled_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
    Amount: `$${Number(b.total_paid).toFixed(2)}`,
    Status: b.status,
  }))

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#aaa] font-sans mb-1">Billing</p>
        <h1 className="text-2xl font-bold font-serif text-white italic">Membership &amp; Payments</h1>
      </div>

      {/* Current plan */}
      <div className="rounded-xl border border-[#1d4c36] p-6 space-y-5" style={{ background: '#163d2a' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-widest text-[#8FA889] font-sans">Current Plan</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl font-bold font-serif text-white">{TIER_LABELS[tier] ?? tier}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIER_COLOR[tier] ?? TIER_COLOR.free}`}>
                {isCancelPending ? 'Cancelling' : isPaused ? 'Paused' : membership?.status ?? 'active'}
              </span>
            </div>
            <p className="text-sm text-[#8FA889]">{TIER_PRICE[tier] ?? '—'}</p>
          </div>
          {membership?.current_period_end && (
            <div className="text-right shrink-0">
              <p className="text-xs text-[#8FA889]">{isCancelPending ? 'Access until' : 'Renews'}</p>
              <p className="text-sm text-white font-medium">
                {new Date(membership.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          )}
        </div>

        {isCancelPending && (
          <div className="bg-red-900/30 border border-red-700/40 rounded-lg px-4 py-3 text-sm text-red-300">
            Your membership is set to cancel at the end of the current period. You retain full access until then.
          </div>
        )}

        {tier !== 'free' && (
          <MembershipActions
            tier={tier}
            isPaused={isPaused}
            pausedUntil={membership?.paused_until ?? null}
            isCancelPending={isCancelPending}
          />
        )}

        {tier === 'free' && (
          <a
            href="/app/membership"
            className="inline-block px-5 py-2.5 rounded-lg text-sm font-medium bg-[#E0A800] text-[#1A1A1A] hover:bg-[#c89600] transition-colors"
          >
            Upgrade to Eagle or Ace →
          </a>
        )}
      </div>

      {/* Payment history */}
      <div className="rounded-xl border border-[#1d4c36] overflow-hidden" style={{ background: '#163d2a' }}>
        <div className="px-6 py-4 border-b border-[#1d4c36] flex items-center justify-between">
          <h2 className="font-semibold text-white">Payment History</h2>
          <CsvExportButton data={csvData} filename="teeahead-payments.csv" label="Export CSV" />
        </div>
        {(bookings ?? []).length === 0 ? (
          <div className="px-6 py-10 text-center text-[#8FA889] text-sm">No payments yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1d4c36]">
                {['Date', 'Course', 'Tee Time', 'Amount'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-medium text-[#8FA889] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(bookings ?? []).map(b => (
                <tr key={b.id} className="border-b border-[#1d4c36]/50 hover:bg-white/5">
                  <td className="px-6 py-3 text-[#ddd]">
                    {new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-3 text-white font-medium">{(b.tee_times as any)?.courses?.name ?? '—'}</td>
                  <td className="px-6 py-3 text-[#ddd]">
                    {new Date((b.tee_times as any)?.scheduled_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-3 text-white font-medium">${Number(b.total_paid).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
