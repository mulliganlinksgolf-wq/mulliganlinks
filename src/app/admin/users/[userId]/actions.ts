'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit'
import { revalidatePath } from 'next/cache'

const ADMIN_EMAILS = ['mulliganlinksgolf@gmail.com', 'nbarris11@gmail.com', 'beslock@yahoo.com']

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
  } catch (e: any) {
    return { error: e.message ?? 'Something went wrong.' }
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
  } catch (e: any) {
    return { error: e.message ?? 'Something went wrong.' }
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
  } catch (e: any) {
    return { error: e.message ?? 'Something went wrong.' }
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
  } catch (e: any) {
    return { error: e.message ?? 'Something went wrong.' }
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
  } catch (e: any) {
    return { error: e.message ?? 'Something went wrong.' }
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
        expand: ['latest_invoice.payment_intent'],
      })

      let refundCents = 0
      const invoice = (sub as any).latest_invoice
      if (invoice?.payment_intent?.amount_received && sub.current_period_start && sub.current_period_end) {
        const totalDays = (sub.current_period_end - sub.current_period_start) / 86400
        const daysUsed = (Math.floor(Date.now() / 1000) - sub.current_period_start) / 86400
        const daysRemaining = Math.max(0, totalDays - daysUsed)
        refundCents = Math.round((daysRemaining / totalDays) * invoice.payment_intent.amount_received)
      }

      await stripe.subscriptions.cancel(membership.stripe_subscription_id)

      if (refundCents > 0 && invoice?.payment_intent?.latest_charge) {
        await stripe.refunds.create({
          charge: invoice.payment_intent.latest_charge as string,
          amount: refundCents,
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
  } catch (e: any) {
    return { error: e.message ?? 'Something went wrong.' }
  }
}
