// Legal note: All competitor references are based on publicly available data.
// See src/lib/vendorPricing.ts for full attribution.
// Last legal review: April 2026.
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { SoftwareCostPage } from '@/components/SoftwareCostPage'

export const metadata: Metadata = {
  title: 'Software Cost Calculator: What is your golf software actually costing you? — TeeAhead',
  description:
    'foreUP, Lightspeed, Club Caddie, Club Prophet — they all charge real money and route your golfer data through marketplaces. Calculate the full cost in 30 seconds. No login. No email required.',
  openGraph: {
    title: 'What is your golf software actually costing you?',
    description:
      'Subscription fees + payment processing markup + golfer data extraction + marketplace barter. The full picture, in dollars.',
    type: 'website',
  },
}

export default async function SoftwareCostCalculatorPage() {
  const supabase = await createClient()
  const { data: counter } = await supabase
    .from('founding_partner_counter')
    .select('count, cap')
    .single()

  const spotsRemaining = (counter?.cap ?? 10) - (counter?.count ?? 0)

  return <SoftwareCostPage spotsRemaining={spotsRemaining} />
}
