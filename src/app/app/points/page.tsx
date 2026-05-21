// src/app/app/points/page.tsx
import { createClient } from '@/lib/supabase/server'
import { getAndIssueMemberCredits } from '@/app/actions/booking'
import { COMP_DEFAULT } from '@/lib/redemption'

export default async function PointsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: membership } = await supabase
    .from('memberships')
    .select('tier, comp_rounds_remaining, comp_rounds_reset_at')
    .eq('user_id', user!.id)
    .eq('status', 'active')
    .single()

  const tier = membership?.tier ?? 'free'
  const earnRate = tier === 'ace' ? '2×' : tier === 'eagle' ? '1.5×' : '1×'
  const isPaid = tier === 'eagle' || tier === 'ace'

  const resetAt = membership?.comp_rounds_reset_at ? new Date(membership.comp_rounds_reset_at) : null
  const compRoundsRemaining = resetAt && resetAt < new Date()
    ? (COMP_DEFAULT[tier] ?? 0)
    : (membership?.comp_rounds_remaining ?? 0)
  const compResetDisplay = resetAt && resetAt > new Date()
    ? resetAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  const [{ data: transactions }, creditBalanceCents] = await Promise.all([
    supabase
      .from('fairway_points')
      .select('id, amount, reason, created_at, courses(name)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false }),
    getAndIssueMemberCredits(user!.id, tier),
  ])

  const balance = (transactions ?? []).reduce((s, t) => s + (t.amount as number), 0)

  const ytdStart = new Date(new Date().getFullYear(), 0, 1)
  const ytdEarned = (transactions ?? [])
    .filter(t => (t.amount as number) > 0 && new Date(t.created_at as string) >= ytdStart)
    .reduce((s, t) => s + (t.amount as number), 0)
  const redeemedCents = Math.abs(
    (transactions ?? [])
      .filter(t => (t.amount as number) < 0)
      .reduce((s, t) => s + (t.amount as number), 0)
  )

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  type Txn = (typeof transactions extends (infer R)[] | null ? R : never)
  const txnKind = (t: Txn): 'earn' | 'bonus' | 'redeem' => {
    const amt = t.amount as number
    if (amt < 0) return 'redeem'
    const r = ((t.reason as string) ?? '').toLowerCase()
    if (r.includes('bonus') || r.includes('signup') || r.includes('tier')) return 'bonus'
    return 'earn'
  }

  return (
    <div className="-mx-8 -my-8 md:-ml-56 md:-mr-8 md:-my-8 min-h-[calc(100vh-72px)] md:min-h-screen flex flex-col bg-[#FAF7F2]">
      {/* Dark hero block */}
      <header className="bg-[#082419] text-[#F4F1EA] px-5 sm:px-8 md:pl-64 pt-6 pb-7">
        <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#E0A800] font-semibold">
          Fairway points · balance
        </p>
        <p
          className="font-display leading-[0.9] tracking-[-0.025em] mt-2"
          style={{ fontSize: 'clamp(56px, 14vw, 96px)', fontWeight: 400 }}
        >
          {balance.toLocaleString()}
        </p>
        <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-[#F4F1EA]/55 mt-2">
          ${(balance / 100).toFixed(2)} value · 100 pts = $1
        </p>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <SummaryTile label="This year" value={`+${ytdEarned.toLocaleString()}`} accent="gold" />
          <SummaryTile label="Redeemed" value={`$${(redeemedCents / 100).toFixed(0)}`} />
          <SummaryTile label="Earn rate" value={earnRate} />
          {isPaid ? (
            <SummaryTile
              label={`Comp rounds${compResetDisplay ? ` · reset ${compResetDisplay}` : ''}`}
              value={`${compRoundsRemaining}`}
            />
          ) : creditBalanceCents > 0 ? (
            <SummaryTile label="Credit ready" value={`$${(creditBalanceCents / 100).toFixed(0)}`} accent="gold" />
          ) : null}
        </div>
      </header>

      {/* Activity */}
      <section className="px-5 sm:px-8 md:pl-64 pt-5 pb-8 flex-1">
        <div className="max-w-2xl">
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#6B7770] font-semibold mb-3">
            Activity
          </p>
          {!transactions || transactions.length === 0 ? (
            <div className="bg-white rounded-[10px] border border-[#0F3D2E]/10 p-10 text-center">
              <p className="font-display text-2xl text-[#0F3D2E] mb-2" style={{ fontWeight: 400 }}>Every round earns. Every point spends.</p>
              <p className="text-sm text-[#6B7770]">Book a tee time and your first ~45 points land here.</p>
            </div>
          ) : (
            <ul className="bg-white rounded-[10px] border border-[#0F3D2E]/10 overflow-hidden">
              {transactions.map(t => {
                const kind = txnKind(t)
                const colorClass =
                  kind === 'redeem' ? 'text-[#C24A3B]' :
                  kind === 'bonus' ? 'text-[#E0A800]' :
                  'text-[#0F3D2E]'
                const amt = t.amount as number
                return (
                  <li key={t.id} className="flex justify-between items-center px-5 py-3.5 border-b border-[#0F3D2E]/10 last:border-b-0">
                    <div className="min-w-0 mr-3">
                      <p className="text-[13.5px] font-medium text-[#1A1A1A] truncate">{t.reason as string}</p>
                      <p className="text-[11px] text-[#6B7770] mt-0.5 truncate">
                        {((t.courses as { name?: string } | null)?.name) ?? '—'} · {formatDate(t.created_at as string)}
                      </p>
                    </div>
                    <span className={`font-mono text-[13px] font-bold tracking-[0.02em] ${colorClass} flex-shrink-0`}>
                      {amt > 0 ? '+' : ''}{amt.toLocaleString()}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}

function SummaryTile({ label, value, accent }: { label: string; value: string; accent?: 'gold' }) {
  return (
    <div className="rounded-lg bg-white/[0.06] border border-white/10 px-3 py-2.5">
      <p
        className={`font-display leading-none tracking-[-0.02em] ${accent === 'gold' ? 'text-[#E0A800]' : 'text-[#F4F1EA]'}`}
        style={{ fontSize: 22, fontWeight: 400 }}
      >
        {value}
      </p>
      <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-[#F4F1EA]/55 mt-1.5 truncate">{label}</p>
    </div>
  )
}
