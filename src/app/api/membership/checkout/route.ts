import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: user.email ?? profile?.email ?? undefined,
    metadata: { user_id: user.id, tier },
    subscription_data: { metadata: { user_id: user.id, tier } },
    success_url: `${baseUrl}/app/membership?success=1&tier=${tier}`,
    cancel_url: `${baseUrl}/app/membership`,
  })

  return NextResponse.redirect(session.url!, 303)
}
