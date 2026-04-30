import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { DamagePage } from '@/components/DamagePage'

export const metadata: Metadata = {
  title: 'GolfNow Damage Report — What Has GolfNow Cost Your Course? | TeeAhead',
  description:
    'Calculate how much GolfNow barter has cost your Metro Detroit golf course. Enter your green fee and see the total damage — then see what TeeAhead would have cost instead.',
}

export default async function GolfNowDamageReportPage() {
  const supabase = await createClient()
  const { data: counter } = await supabase
    .from('founding_partner_counter')
    .select('count, cap')
    .single()

  const spotsRemaining = (counter?.cap ?? 10) - (counter?.count ?? 0)

  return <DamagePage spotsRemaining={spotsRemaining} />
}
