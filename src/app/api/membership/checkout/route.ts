import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'

const PRICE_IDS: Record<string, string> = {
  eagle: process.env.STRIPE_PRICE_EAGLE!,
  ace:   process.env.STRIPE_PRICE_ACE!,
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const tier = formData.get('tier') as string
  const priceId = PRICE_IDS[tier]
  if (!priceId) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  // For Eagle signups, atomically try to claim a founding spot
  let isFoundingGolfer = false
  if (tier === 'eagle') {
    const admin = createAdminClient()
    const { data, error } = await admin.rpc('claim_founding_spot')
    if (!error && data === true) {
      isFoundingGolfer = true
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: user.email ?? profile?.email ?? undefined,
    metadata: { user_id: user.id, tier, founding_golfer: isFoundingGolfer ? 'true' : 'false' },
    subscription_data: {
      metadata: { user_id: user.id, tier },
      ...(isFoundingGolfer ? { trial_period_days: 90 } : {}),
    },
    success_url: `${baseUrl}/app/membership?success=1&tier=${tier}`,
    cancel_url: `${baseUrl}/app/membership`,
  })

  return NextResponse.redirect(session.url!, 303)
}
