import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendReferralAttributionAlert } from '@/lib/resend'

// 10% rev share rate — change site_config row 'referral_rev_share_rate' in V1.1 to make this dynamic
const REV_SHARE_RATE = 0.1

// Hardcoded per-tier amounts in cents (Eagle $89/yr, Ace $159/yr)
// TODO V1.1: read from site_config or pull from Stripe price object
const TIER_AMOUNTS: Record<string, number> = {
  eagle: 8900,
  ace: 15900,
}

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' })
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[webhook] signature verification failed', err)
    return new NextResponse('Bad signature', { status: 400 })
  }

  const supabase = createAdminClient()

  if (event.type === 'customer.subscription.created' || event.type === 'checkout.session.completed') {
    await handleMembershipActivated(event, supabase)
  }

  // TODO V1.1: handle 'customer.subscription.deleted' to set payout_status='reversed' for active referrals

  return NextResponse.json({ received: true })
}

async function handleMembershipActivated(
  event: Stripe.Event,
  supabase: ReturnType<typeof createAdminClient>
) {
  let profileId: string | null = null
  let tier: string | null = null

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    profileId = session.metadata?.profile_id ?? null
    tier = session.metadata?.tier ?? null
  } else if (event.type === 'customer.subscription.created') {
    const sub = event.data.object as Stripe.Subscription
    profileId = sub.metadata?.profile_id ?? null
    tier = sub.metadata?.tier ?? null
  }

  if (!profileId || !tier) return

  const priceCents = TIER_AMOUNTS[tier]
  if (!priceCents) return

  const revShareCents = Math.round(priceCents * REV_SHARE_RATE)

  // Find the membership row (may be just-created via another webhook handler)
  const { data: membership } = await supabase
    .from('memberships')
    .select('id')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Update the referral row if it exists and hasn't expired
  const { data: updated } = await supabase
    .from('course_referrals')
    .update({
      membership_id: membership?.id ?? null,
      membership_tier: tier,
      membership_amount_cents: priceCents,
      // Lock rev share at initial signup tier — upgrades do NOT earn additional rev share (V1.1 TODO)
      rev_share_cents: revShareCents,
      payout_status: 'pending',
    })
    .eq('profile_id', profileId)
    .gte('expires_at', new Date().toISOString())
    .is('membership_tier', null) // only set once — don't overwrite on upgrade
    .select('course_id')
    .single()

  if (!updated?.course_id) return

  // Send notification to course owners (fire-and-forget)
  const [{ data: profile }, { data: courseStaff }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', profileId).single(),
    supabase.from('course_admins')
      .select('profiles!inner(email:profiles(email))')
      .eq('course_id', updated.course_id)
      .in('role', ['owner', 'manager']),
  ])

  // Flatten staff emails
  const emails: string[] = (courseStaff ?? [])
    .flatMap((row: any) => {
      const emailVal = row.profiles?.email ?? row.profiles?.profiles?.email
      return emailVal ? [emailVal] : []
    })

  if (emails.length > 0) {
    const firstName = (profile?.full_name ?? '').split(' ')[0] || 'A golfer'
    await sendReferralAttributionAlert({
      courseEmails: emails,
      golferFirstName: firstName,
      tier,
      revShareDollars: revShareCents / 100,
    }).catch(() => {})
  }
}
