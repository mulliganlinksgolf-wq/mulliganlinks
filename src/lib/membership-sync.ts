import 'server-only'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { attributePaidReferral } from '@/lib/referral-payment'
import { issueGuestPasses } from '@/app/actions/guestPasses'

type Admin = ReturnType<typeof createAdminClient>
export async function syncMembershipSubscription(sub: Stripe.Subscription, admin: Admin) {
  const userId = sub.metadata.user_id
  const tier = sub.metadata.tier
  if (!userId || !['eagle', 'ace'].includes(tier)) return
  const periodEnd = sub.items.data[0]?.current_period_end
  if (!periodEnd) throw new Error('Missing subscription period')
  const active = sub.status === 'active' || sub.status === 'trialing'
  // An unpaid new subscription must not replace the member's free baseline.
  if (sub.status === 'incomplete') return
  const status = active ? 'active' : ['past_due', 'unpaid'].includes(sub.status) ? 'past_due' : 'canceled'
  const { error } = await admin.from('memberships').upsert({
    user_id: userId, tier, status, stripe_subscription_id: sub.id,
    stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
    current_period_end: new Date(periodEnd * 1000).toISOString(),
    cancel_at_period_end: sub.cancel_at_period_end,
    canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
    paused_until: sub.pause_collection?.resumes_at ? new Date(sub.pause_collection.resumes_at * 1000).toISOString() : null,
  }, { onConflict: 'user_id' })
  if (error) throw error
  if (active) {
    // Anniversary rather than invoice period: the founding trial must not grant
    // a second set of passes when the first paid invoice follows it.
    const anniversary = new Date(sub.start_date * 1000)
    if (!Number.isFinite(anniversary.getTime())) throw new Error('Missing subscription start date')
    do { anniversary.setUTCFullYear(anniversary.getUTCFullYear() + 1) } while (anniversary <= new Date())
    await issueGuestPasses(userId, tier, sub.id, anniversary.toISOString())
  }
}

export async function handleMembershipEvent(event: Stripe.Event, admin: Admin) {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    if (session.mode !== 'subscription' || !session.subscription) return
    const id = typeof session.subscription === 'string' ? session.subscription : session.subscription.id
    await syncMembershipSubscription(await stripe.subscriptions.retrieve(id), admin)
    if (session.metadata?.founding_golfer === 'true' && session.metadata.user_id) {
      const { error } = await admin.from('profiles').update({ founding_member: true }).eq('id', session.metadata.user_id)
      if (error) throw error
    }
  } else if (['customer.subscription.updated', 'customer.subscription.deleted'].includes(event.type)) {
    // Fetch current Stripe state so a delayed event cannot undo a later change.
    const sub = event.data.object as Stripe.Subscription
    await syncMembershipSubscription(await stripe.subscriptions.retrieve(sub.id), admin)
  } else if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }
    const pointer = invoice.parent?.subscription_details?.subscription ?? invoice.subscription
    const id = typeof pointer === 'string' ? pointer : pointer?.id
    if (id) {
      const sub = await stripe.subscriptions.retrieve(id)
      await syncMembershipSubscription(sub, admin)
      if (event.type === 'invoice.paid') await attributePaidReferral(sub, invoice.amount_paid, admin)
    }
  }
}
