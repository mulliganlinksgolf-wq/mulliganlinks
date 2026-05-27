import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { BarterPage } from '@/components/BarterPage'

export const metadata: Metadata = {
  title: 'Barter Calculator: What GolfNow Costs Your Course',
  description: "See exactly what GolfNow's barter model has cost your golf course this year. Free calculator, no login required.",
  alternates: { canonical: '/barter' },
  openGraph: {
    url: '/barter',
    title: "What has GolfNow actually cost your course?",
    description: "Drop in your numbers. We'll show you the dollars GolfNow's barter model extracts from your course every year.",
    images: [{ url: '/og-barter.png', width: 1200, height: 630 }],
  },
}

export default async function BarterCalculatorPage() {
  const supabase = await createClient()
  const [{ data: counter }, { data: contentRows }] = await Promise.all([
    supabase.from('founding_partner_counter').select('count, cap').single(),
    supabase.from('content_blocks').select('key, value').ilike('key', 'barter.%'),
  ])

  const spotsRemaining = (counter?.cap ?? 10) - (counter?.count ?? 0)
  const content: Record<string, string> = Object.fromEntries(
    (contentRows ?? []).map((r: { key: string; value: string }) => [r.key, r.value])
  )

  return <BarterPage spotsRemaining={spotsRemaining} content={content} />
}
