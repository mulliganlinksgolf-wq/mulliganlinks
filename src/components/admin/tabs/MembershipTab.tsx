interface MembershipTabProps {
  membership: {
    tier: string; status: string; stripe_subscription_id: string | null
    stripe_customer_id: string | null; current_period_end: string | null
    cancel_at_period_end: boolean; created_at: string
  } | null
  isFoundingMember: boolean
}

export default function MembershipTab({ membership, isFoundingMember }: MembershipTabProps) {
  if (!membership) return <p className="text-sm text-[#6B7770]">No membership record found.</p>

  const rows = [
    { label: 'Tier', value: <span className="capitalize">{membership.tier}</span> },
    { label: 'Status', value: <span className="capitalize">{membership.status.replace('_', ' ')}</span> },
    { label: 'Stripe Subscription ID', value: membership.stripe_subscription_id ?? '—' },
    { label: 'Stripe Customer ID', value: membership.stripe_customer_id ?? '—' },
    { label: 'Current Period End', value: membership.current_period_end ? new Date(membership.current_period_end).toLocaleDateString() : '—' },
    { label: 'Cancel at Period End', value: membership.cancel_at_period_end ? 'Yes' : 'No' },
    { label: 'Founding Member', value: isFoundingMember ? 'Yes' : 'No' },
    { label: 'Date Joined', value: new Date(membership.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
  ]

  return (
    <dl className="divide-y divide-black/5 max-w-lg">
      {rows.map(({ label, value }) => (
        <div key={label} className="flex justify-between py-3 text-sm">
          <dt className="text-[#6B7770]">{label}</dt>
          <dd className="font-medium text-[#1A1A1A]">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
