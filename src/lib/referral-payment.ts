import 'server-only'
import type Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

// Financial attribution is conditional on a paid invoice, not subscription creation.
// One conditional update locks in the first paid tier and is safe across retries.
export async function attributePaidReferral(sub: Stripe.Subscription, paidCents: number, admin: ReturnType<typeof createAdminClient>) {
  const userId = sub.metadata.user_id ?? sub.metadata.profile_id
  const tier = sub.metadata.tier
  if (!userId || !['eagle','ace'].includes(tier) || paidCents <= 0) return
  const { data: membership, error: readError } = await admin.from('memberships').select('id')
    .eq('user_id', userId).eq('stripe_subscription_id', sub.id).maybeSingle()
  if (readError) throw readError
  if (!membership) throw new Error('Membership must be synced before referral attribution')
  const { error } = await admin.from('course_referrals').update({
    membership_id: membership.id, membership_tier: tier, membership_amount_cents: paidCents,
    rev_share_cents: Math.round(paidCents * 0.1), payout_status: 'pending',
  }).eq('profile_id', userId).gte('expires_at', new Date().toISOString()).is('membership_tier', null)
  if (error) throw error
}
