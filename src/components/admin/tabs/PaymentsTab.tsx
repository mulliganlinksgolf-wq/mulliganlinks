interface Booking {
  id: string; created_at: string; paid_at: string | null
  total_charged_cents: number | null; payment_status: string | null
  stripe_charge_id: string | null; course_name: string | null; players: number
}

interface PaymentsTabProps {
  bookings: Booking[]
  membership: {
    tier: string
    stripe_subscription_id: string | null
    current_period_end: string | null
    created_at: string
  } | null
}

export default function PaymentsTab({ bookings, membership }: PaymentsTabProps) {
  const bookingRows = bookings
    .filter(b => b.total_charged_cents && b.total_charged_cents > 0)
    .map(b => ({
      id: b.id,
      date: b.paid_at ?? b.created_at,
      description: b.course_name
        ? `${b.course_name} — ${b.players} player${b.players !== 1 ? 's' : ''}`
        : 'Tee time booking',
      amount: b.total_charged_cents!,
      status: b.payment_status ?? 'unknown',
      reference: b.stripe_charge_id ? `…${b.stripe_charge_id.slice(-8)}` : '—',
    }))

  const membershipRow = membership?.stripe_subscription_id
    ? [{
        id: 'membership',
        date: membership.created_at,
        description: `${membership.tier.charAt(0).toUpperCase() + membership.tier.slice(1)} membership`,
        amount: null as number | null,
        status: 'subscription',
        reference: `…${membership.stripe_subscription_id.slice(-8)}`,
      }]
    : []

  const rows = [...membershipRow, ...bookingRows]

  if (rows.length === 0) {
    return <p className="text-sm text-[#6B7770]">No payment history found.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-[#FAF7F2] text-[#6B7770] border-b border-black/5">
          <tr>
            <th className="text-left px-4 py-2 font-medium">Date</th>
            <th className="text-left px-4 py-2 font-medium">Description</th>
            <th className="text-right px-4 py-2 font-medium">Amount</th>
            <th className="text-left px-4 py-2 font-medium">Status</th>
            <th className="text-left px-4 py-2 font-medium">Ref</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {rows.map(r => (
            <tr key={r.id}>
              <td className="px-4 py-3 text-[#6B7770]">{new Date(r.date).toLocaleDateString()}</td>
              <td className="px-4 py-3">{r.description}</td>
              <td className="px-4 py-3 text-right font-medium">
                {r.amount != null ? `$${(r.amount / 100).toFixed(2)}` : '—'}
              </td>
              <td className="px-4 py-3 capitalize text-[#6B7770]">{r.status}</td>
              <td className="px-4 py-3 font-mono text-xs text-[#6B7770]">{r.reference}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
