import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
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
  const multiplier = tier === 'ace' ? 3 : tier === 'eagle' ? 2 : 1

  const [{ data: transactions }, creditBalanceCents] = await Promise.all([
    supabase
      .from('fairway_points')
      .select('id, amount, reason, created_at, courses(name)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false }),
    getAndIssueMemberCredits(user!.id, tier),
  ])

  const balance = transactions?.reduce((s, t) => s + t.amount, 0) ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Fairway Points</h1>
        <p className="text-[#6B7770] mt-1">Earn points on every round. Redeem at checkout.</p>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-[#1B4332] border-0 shadow-sm sm:col-span-1">
          <CardContent className="pt-6 pb-6">
            <p className="text-[#FAF7F2]/70 text-sm">Points balance</p>
            <p className="text-4xl font-bold text-[#FAF7F2] mt-1">{balance.toLocaleString()}</p>
            <p className="text-[#FAF7F2]/70 text-sm mt-1">${(balance / 100).toFixed(2)} value</p>
          </CardContent>
        </Card>
        {creditBalanceCents > 0 ? (
          <Card className="bg-[#E0A800]/10 border-0 shadow-sm ring-1 ring-[#E0A800]/40">
            <CardContent className="pt-6 pb-6">
              <p className="text-[#6B7770] text-sm">Member credit</p>
              <p className="text-3xl font-bold text-[#1A1A1A] mt-1">${(creditBalanceCents / 100).toFixed(2)}</p>
              <p className="text-[#6B7770] text-sm mt-1">Apply at checkout</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="pt-6 pb-6">
              <p className="text-[#6B7770] text-sm">Earn rate</p>
              <p className="text-3xl font-bold text-[#1A1A1A] mt-1">{multiplier}x</p>
              <p className="text-[#6B7770] text-sm mt-1">pts per dollar</p>
            </CardContent>
          </Card>
        )}
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="pt-6 pb-6">
            <p className="text-[#6B7770] text-sm">Earn rate</p>
            <p className="text-3xl font-bold text-[#1A1A1A] mt-1">{multiplier}x</p>
            <p className="text-[#6B7770] text-sm mt-1">pts per dollar</p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction history */}
      <div>
        <h2 className="text-sm font-semibold text-[#6B7770] uppercase tracking-wide mb-3">History</h2>
        <div className="bg-white rounded-lg border-0 shadow-sm overflow-hidden">
          {!transactions || transactions.length === 0 ? (
            <div className="py-12 text-center text-[#6B7770]">No transactions yet. Book a tee time to start earning.</div>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {transactions.map(t => (
                  <tr key={t.id} className="px-4">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#1A1A1A]">{t.reason}</p>
                      <p className="text-xs text-[#6B7770] mt-0.5">
                        {(t.courses as any)?.name} · {new Date(t.created_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      <span className={t.amount > 0 ? 'text-[#1B4332]' : 'text-red-500'}>
                        {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
