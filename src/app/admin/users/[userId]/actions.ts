'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit'
import { revalidatePath } from 'next/cache'

const ADMIN_EMAILS = ['mulliganlinksgolf@gmail.com', 'neil@teeahead.com', 'beslock@yahoo.com']

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!ADMIN_EMAILS.includes(user.email ?? '') && !profile?.is_admin) throw new Error('Not authorized')
  return { admin, user }
}

export async function saveProfile(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    const { admin, user } = await assertAdmin()
    const userId = formData.get('userId') as string
    const full_name = (formData.get('full_name') as string).trim()
    const phone = (formData.get('phone') as string).trim() || null
    const home_course_id = (formData.get('home_course_id') as string).trim() || null
    const founding_member = formData.get('founding_member') === 'true'
    const is_admin = formData.get('is_admin') === 'true'
    const newEmail = (formData.get('email') as string).trim().toLowerCase()

    if (!full_name) return { error: 'Name is required.' }

    const { error: profileError } = await admin.from('profiles')
      .update({ full_name, phone, home_course_id, founding_member, is_admin })
      .eq('id', userId)
    if (profileError) return { error: profileError.message }

    if (newEmail) {
      const { error: emailError } = await admin.auth.admin.updateUserById(userId, { email: newEmail })
      if (emailError) return { error: emailError.message }
      await admin.from('profiles').update({ email: newEmail }).eq('id', userId)
    }

    await writeAuditLog({
      eventType: 'profile_updated',
      targetType: 'member',
      targetId: userId,
      targetLabel: full_name,
      details: { updated_by: user.email },
    })
    revalidatePath(`/admin/users/${userId}`)
    return { success: true }
  } catch (e) {
    return { error: (e instanceof Error ? e.message : String(e)) ?? 'Something went wrong.' }
  }
}

export async function addNote(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    const { admin, user } = await assertAdmin()
    const userId = formData.get('userId') as string
    const body = (formData.get('body') as string).trim()
    if (!body) return { error: 'Note cannot be empty.' }

    const { error } = await admin.from('member_admin_notes').insert({
      member_id: userId,
      admin_id: user.id,
      admin_email: user.email ?? '',
      body,
    })
    if (error) return { error: error.message }

    await writeAuditLog({
      eventType: 'admin_note_added',
      targetType: 'member',
      targetId: userId,
      details: { note_preview: body.slice(0, 100) },
    })
    revalidatePath(`/admin/users/${userId}`)
    return { success: true }
  } catch (e) {
    return { error: (e instanceof Error ? e.message : String(e)) ?? 'Something went wrong.' }
  }
}

export async function editTier(
  userId: string,
  newTier: string,
  oldTier: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    const { admin, user } = await assertAdmin()
    const { data: existing } = await admin.from('memberships').select('id').eq('user_id', userId).single()
    if (existing) {
      const { error } = await admin.from('memberships').update({ tier: newTier }).eq('user_id', userId)
      if (error) return { error: error.message }
    } else {
      const { error } = await admin.from('memberships').insert({ user_id: userId, tier: newTier, status: 'active' })
      if (error) return { error: error.message }
    }

    await writeAuditLog({
      eventType: 'tier_changed',
      targetType: 'member',
      targetId: userId,
      details: { from: oldTier, to: newTier, changed_by: user.email },
    })
    revalidatePath(`/admin/users/${userId}`)
    revalidatePath('/admin/users')
    return { success: true }
  } catch (e) {
    return { error: (e instanceof Error ? e.message : String(e)) ?? 'Something went wrong.' }
  }
}

export async function addCredit(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    const { admin, user } = await assertAdmin()
    const userId = formData.get('userId') as string
    const type = formData.get('type') as string
    const amount_cents = Math.round(parseFloat(formData.get('amount') as string) * 100)
    if (isNaN(amount_cents) || amount_cents <= 0) return { error: 'Amount must be a positive number.' }

    const { error } = await admin.from('member_credits').insert({
      user_id: userId,
      type,
      amount_cents,
      status: 'available',
      period: null,
    })
    if (error) return { error: error.message }

    await writeAuditLog({
      eventType: 'credit_added',
      targetType: 'member',
      targetId: userId,
      details: { type, amount_cents, added_by: user.email },
    })
    revalidatePath(`/admin/users/${userId}`)
    return { success: true }
  } catch (e) {
    return { error: (e instanceof Error ? e.message : String(e)) ?? 'Something went wrong.' }
  }
}

export async function adjustPoints(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    const { admin, user } = await assertAdmin()
    const userId = formData.get('userId') as string
    const amount = parseInt(formData.get('amount') as string, 10)
    const reason = (formData.get('reason') as string).trim()
    if (isNaN(amount) || amount === 0) return { error: 'Amount must be a non-zero integer.' }
    if (!reason) return { error: 'Reason is required.' }

    const { error } = await admin.from('fairway_points').insert({
      user_id: userId,
      amount,
      reason: `Admin adjustment: ${reason}`,
    })
    if (error) return { error: error.message }

    await writeAuditLog({
      eventType: 'points_adjusted',
      targetType: 'member',
      targetId: userId,
      details: { amount, reason, adjusted_by: user.email },
    })
    revalidatePath(`/admin/users/${userId}`)
    return { success: true }
  } catch (e) {
    return { error: (e instanceof Error ? e.message : String(e)) ?? 'Something went wrong.' }
  }
}

export async function cancelMembership(
  userId: string,
  mode: 'now' | 'period_end'
): Promise<{ error?: string; success?: boolean; refundAmount?: number }> {
  try {
    const { admin, user } = await assertAdmin()

    const { data: membership } = await admin
      .from('memberships')
      .select('stripe_subscription_id, stripe_customer_id, current_period_end, tier')
      .eq('user_id', userId)
      .single()

    if (!membership?.stripe_subscription_id) return { error: 'No active Stripe subscription found.' }

    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

    if (mode === 'period_end') {
      await stripe.subscriptions.update(membership.stripe_subscription_id, {
        cancel_at_period_end: true,
      })
      const { error } = await admin.from('memberships')
        .update({ cancel_at_period_end: true })
        .eq('user_id', userId)
      if (error) return { error: error.message }

      await writeAuditLog({
        eventType: 'membership_cancelled',
        targetType: 'member',
        targetId: userId,
        details: { mode: 'period_end', tier: membership.tier, by: user.email },
      })
      revalidatePath(`/admin/users/${userId}`)
      revalidatePath('/admin/users')
      return { success: true }
    } else {
      const sub = await stripe.subscriptions.retrieve(membership.stripe_subscription_id, {
        expand: ['latest_invoice'],
      })

      // Modern Stripe stores periods on subscription items and payments on invoices.
      // Accept the older expanded shape as well for existing recorded responses.
      const legacy = sub as typeof sub & { current_period_start?: number; current_period_end?: number }
      const periodStart = sub.items?.data[0]?.current_period_start ?? legacy.current_period_start
      const periodEnd = sub.items?.data[0]?.current_period_end ?? legacy.current_period_end
      const invoice = typeof sub.latest_invoice === 'object' ? sub.latest_invoice : null
      let paymentIntent = (invoice as (import('stripe').default.Invoice & { payment_intent?: import('stripe').default.PaymentIntent }) | null)?.payment_intent
      let paidAmount = paymentIntent?.amount_received ?? 0
      if (!paymentIntent && invoice?.id && invoice.amount_paid > 0) {
        const payments = await stripe.invoicePayments.list({ invoice: invoice.id, status: 'paid', limit: 2, expand: ['data.payment.payment_intent'] })
        if (payments.has_more || payments.data.length !== 1) throw new Error('Review this invoice in Stripe before refunding multiple payments.')
        const payment = payments.data[0]
        const intent = payment.payment.payment_intent
        paymentIntent = typeof intent === 'string' ? await stripe.paymentIntents.retrieve(intent) : intent
        paidAmount = payment.amount_paid ?? 0
        if (!paymentIntent) throw new Error('This invoice payment needs a manual refund in Stripe.')
      }
      if (paidAmount > 0 && (!periodStart || !periodEnd || periodEnd <= periodStart)) throw new Error('Cannot determine the refundable billing period.')
      if (paidAmount > 0 && !paymentIntent?.latest_charge) throw new Error('Cannot locate the paid charge. Review this invoice in Stripe before canceling.')
      const canceled = sub.status === 'canceled' ? sub : await stripe.subscriptions.cancel(membership.stripe_subscription_id)
      const canceledAt = canceled.canceled_at ?? Math.floor(Date.now() / 1000)
      const ratio = periodStart && periodEnd ? Math.max(0, Math.min(1, (periodEnd - canceledAt) / (periodEnd - periodStart))) : 0
      const refundCents = Math.round(ratio * paidAmount)

      if (refundCents > 0 && paymentIntent?.latest_charge) {
        const charge = typeof paymentIntent.latest_charge === 'string' ? paymentIntent.latest_charge : paymentIntent.latest_charge.id
        await stripe.refunds.create({ charge, amount: refundCents }, {
          idempotencyKey: `membership-cancel-${membership.stripe_subscription_id}`,
        })
        await writeAuditLog({
          eventType: 'refund_issued',
          targetType: 'member',
          targetId: userId,
          details: { amount_cents: refundCents, tier: membership.tier, by: user.email },
        })
      }

      const { error } = await admin.from('memberships')
        .update({ status: 'canceled', canceled_at: new Date().toISOString(), cancel_at_period_end: false })
        .eq('user_id', userId)
      if (error) return { error: error.message }

      await writeAuditLog({
        eventType: 'membership_cancelled',
        targetType: 'member',
        targetId: userId,
        details: { mode: 'immediate', tier: membership.tier, refund_cents: refundCents, by: user.email },
      })

      revalidatePath(`/admin/users/${userId}`)
      revalidatePath('/admin/users')
      return { success: true, refundAmount: refundCents }
    }
  } catch (e) {
    return { error: (e instanceof Error ? e.message : String(e)) ?? 'Something went wrong.' }
  }
}
