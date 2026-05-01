// src/app/app/points/page.tsx
import { createClient } from '@/lib/supabase/server'
import { getAndIssueMemberCredits } from '@/app/actions/booking'

export default async function PointsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: membership } = await supabase
    .from('memberships')
    .select('tier')
    .eq('user_id', user!.id)
    .eq('status', 'active')
    .single()

  const tier = membership?.tier ?? 'free'
  const earnRate = tier === 'ace' ? '2×' : tier === 'eagle' ? '1.5×' : '1×'

  const [{ data: transactions }, creditBalanceCents] = await Promise.all([
    supabase
      .from('fairway_points')
      .select('id, amount, reason, created_at, courses(name)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false }),
    getAndIssueMemberCredits(user!.id, tier),
  ])

  const balance = (transactions ?? []).reduce((s, t) => s + (t.amount as number), 0)

  return (
    <div className="rounded-xl overflow-hidden">
      {/* Dark header with inline stats */}
      <div className="px-5 py-5" style={{ background: '#1B4332' }}>
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#888] font-sans mb-3">
          Fairway Points
        </p>
        <div className="flex items-end gap-6 flex-wrap">
          <div>
            <p className="text-4xl font-bold font-serif text-white leading-none">
              {balance.toLocaleString()}
            </p>
            <p className="text-[10px] font-sans mt-1" style={{ color: '#8FA889' }}>
              pts · ${(balance / 100).toFixed(2)} value
            </p>
          </div>
          {creditBalanceCents > 0 && (
            <div>
              <p className="text-2xl font-bold font-serif leading-none" style={{ color: '#E0A800' }}>
                ${(creditBalanceCents / 100).toFixed(0)}
              </p>
              <p className="text-[10px] font-sans mt-1" style={{ color: '#8FA889' }}>
                credit ready
              </p>
            </div>
          )}
          <div>
            <p className="text-2xl font-bold font-serif text-white leading-none">{earnRate}</p>
            <p className="text-[10px] font-sans mt-1" style={{ color: '#8FA889' }}>
              earn rate
            </p>
          </div>
        </div>
        <p className="text-[10px] font-sans mt-3" style={{ color: '#555' }}>
          100 pts = $1 toward future rounds.
        </p>
      </div>

      {/* Transaction history */}
      <div style={{ background: '#163d2a' }}>
        <div className="px-4 py-1.5" style={{ background: '#0f2d1d' }}>
          <span className="text-[8px] uppercase tracking-widest font-sans" style={{ color: '#555' }}>
            History
          </span>
        </div>
        {!transactions || transactions.length === 0 ? (
          <div className="py-10 text-center" style={{ color: '#888' }}>
            No transactions yet. Book a tee time to start earning.
          </div>
        ) : (
          transactions.map(t => (
            <div
              key={t.id}
              className="flex items-center justify-between px-4 py-3 border-b border-[#1d4c36] last:border-0"
            >
              <div>
                <p className="text-[11px] font-sans" style={{ color: '#ddd' }}>
                  {t.reason as string}
                </p>
                <p className="text-[9px] font-sans mt-0.5" style={{ color: '#555' }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(t.courses as any)?.name} · {new Date(t.created_at as string).toLocaleDateString()}
                </p>
              </div>
              <span
                className="text-sm font-semibold font-sans"
                style={{ color: (t.amount as number) > 0 ? '#8FA889' : '#ef4444' }}
              >
                {(t.amount as number) > 0 ? '+' : ''}
                {(t.amount as number).toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
