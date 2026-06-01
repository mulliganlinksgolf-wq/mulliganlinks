import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserFromBearer } from '@/lib/mobile-auth'

type Tier = 'free' | 'eagle' | 'ace'

export async function POST(req: NextRequest) {
  const user = await getUserFromBearer(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { tier?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const tier = body.tier as Tier
  if (tier !== 'free' && tier !== 'eagle' && tier !== 'ace') {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('memberships')
    .select('tier, status, stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle()

  // Guard: block re-subscribing if already on an active paid tier.
  if (existing && existing.status === 'active' && (existing.tier === 'eagle' || existing.tier === 'ace')) {
    return NextResponse.json({ error: 'Already an active member', tier: existing.tier }, { status: 409 })
  }

  // Ensure a free baseline membership row exists (no orphaned accounts).
  if (!existing) {
    await admin.from('memberships').insert({ user_id: user.id, tier: 'free', status: 'active' })
  }

  if (tier === 'free') {
    return NextResponse.json({ status: 'active', tier: 'free' })
  }

  // Paid tiers are implemented in Task 4.
  return NextResponse.json({ error: 'Paid tiers not yet implemented' }, { status: 501 })
}
