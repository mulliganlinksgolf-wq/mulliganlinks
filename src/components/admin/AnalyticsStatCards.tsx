interface AnalyticsStatCardsProps {
  mrr: number
  totalMembers: number
  churnRate: number
  avgRevenuePerMember: number
}

export default function AnalyticsStatCards({ mrr, totalMembers, churnRate, avgRevenuePerMember }: AnalyticsStatCardsProps) {
  const cards = [
    {
      label: 'Monthly Recurring Revenue',
      value: `$${mrr.toLocaleString()}`,
      sub: 'from active paid members',
    },
    {
      label: 'Total Members',
      value: totalMembers.toLocaleString(),
      sub: 'registered accounts',
    },
    {
      label: 'Churn Rate',
      value: `${churnRate}%`,
      sub: 'canceled vs total',
    },
    {
      label: 'Avg Revenue / Member',
      value: `$${avgRevenuePerMember}`,
      sub: 'MRR ÷ paid members',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(c => (
        <div key={c.label} className="bg-white rounded-xl p-6 ring-1 ring-black/5">
          <p className="text-xs text-[#6B7770] uppercase tracking-wide font-medium">{c.label}</p>
          <p className="text-3xl font-bold mt-1 text-[#1B4332]">{c.value}</p>
          <p className="text-xs text-[#6B7770] mt-1">{c.sub}</p>
        </div>
      ))}
    </div>
  )
}
