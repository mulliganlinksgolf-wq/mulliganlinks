"use server"

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'
import { revalidatePath } from 'next/cache'
import type Stripe from 'stripe'

async function memberSubscription() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const admin = createAdminClient()
  const { data: membership, error } = await admin.from('memberships')
    .select('stripe_subscription_id, stripe_customer_id, tier, status')
    .eq('user_id', user.id).maybeSingle()
  if (error) throw new Error('Unable to load membership')
  if (!membership?.stripe_subscription_id || !['eagle', 'ace'].includes(membership.tier)) {
    throw new Error('No paid subscription found. Please contact support.')
  }
  const subscription = await stripe.subscriptions.retrieve(membership.stripe_subscription_id)
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
  // Older web subscriptions have user_id metadata but no stored customer ID.
  if (subscription.metadata.user_id !== user.id && customerId !== membership.stripe_customer_id) {
    throw new Error('Subscription does not belong to this account')
  }
  if (!['active', 'trialing', 'past_due', 'unpaid'].includes(subscription.status)) {
    throw new Error('This subscription cannot be changed')
  }
  return { admin, user, subscription }
}

async function saveBillingState(
  admin: ReturnType<typeof createAdminClient>, userId: string, subscription: Stripe.Subscription,
) {
  const { error } = await admin.from('memberships').update({
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
    paused_until: subscription.pause_collection?.resumes_at
      ? new Date(subscription.pause_collection.resumes_at * 1000).toISOString() : null,
  }).eq('user_id', userId).eq('stripe_subscription_id', subscription.id)
  revalidatePath('/app/billing')
  if (error) throw new Error('Your billing change was saved with Stripe, but the account display could not refresh. Please reload before trying again.')
}

export async function pauseMembership(months: 1 | 2): Promise<void> {
  if (months !== 1 && months !== 2) throw new Error('Choose a one- or two-month pause')
  const { admin, user, subscription } = await memberSubscription()
  if (subscription.cancel_at_period_end) throw new Error('This membership is already scheduled to cancel')
  if (subscription.pause_collection) throw new Error('Billing is already paused. Resume before starting a new pause.')
  const pauseUntil = new Date()
  const day = pauseUntil.getUTCDate()
  pauseUntil.setUTCDate(1)
  pauseUntil.setUTCMonth(pauseUntil.getUTCMonth() + months)
  const lastDay = new Date(Date.UTC(pauseUntil.getUTCFullYear(), pauseUntil.getUTCMonth() + 1, 0)).getUTCDate()
  pauseUntil.setUTCDate(Math.min(day, lastDay))
  const updated = await stripe.subscriptions.update(subscription.id, {
    pause_collection: { behavior: 'void', resumes_at: Math.floor(pauseUntil.getTime() / 1000) },
  })
  await saveBillingState(admin, user.id, updated)
}

export async function resumeMembership(): Promise<void> {
  const { admin, user, subscription } = await memberSubscription()
  const updated = await stripe.subscriptions.update(subscription.id, { pause_collection: '' })
  await saveBillingState(admin, user.id, updated)
}

export async function cancelMembership(): Promise<void> {
  const { admin, user, subscription } = await memberSubscription()
  const updated = await stripe.subscriptions.update(subscription.id, { cancel_at_period_end: true })
  await saveBillingState(admin, user.id, updated)
}
