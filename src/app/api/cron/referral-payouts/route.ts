import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' })

  const supabase = createAdminClient()

  // Fetch all pending referrals that have a rev_share amount and a Stripe-onboarded course
  const { data: pending } = await supabase
    .from('course_referrals')
    .select('id, course_id, rev_share_cents, courses!inner(stripe_account_id)')
    .eq('payout_status', 'pending')
    .not('rev_share_cents', 'is', null)
    .gt('rev_share_cents', 0)

  if (!pending?.length) {
    await markExpired(supabase)
    return NextResponse.json({ paid: 0, message: 'No pending referrals' })
  }

  // Group by course, skipping courses without a Stripe account
  const byCourse = new Map<string, { ids: string[]; total: number; stripeAccount: string }>()
  for (const r of pending) {
    const acct = (r.courses as any)?.stripe_account_id as string | undefined
    if (!acct) continue
    const entry = byCourse.get(r.course_id) ?? { ids: [] as string[], total: 0, stripeAccount: acct }
    entry.ids.push(String(r.id))
    entry.total += (r.rev_share_cents as number | null) ?? 0
    byCourse.set(r.course_id, entry)
  }

  let paidCount = 0
  for (const [courseId, batch] of byCourse) {
    if (batch.total < 100) continue // skip payouts under $1 — roll forward to next month

    try {
      const transfer = await stripe.transfers.create({
        amount: batch.total,
        currency: 'usd',
        destination: batch.stripeAccount,
        description: `TeeAhead referral rev share — ${batch.ids.length} member${batch.ids.length !== 1 ? 's' : ''}`,
        metadata: {
          course_id: courseId,
          referral_count: String(batch.ids.length),
        },
      })

      await supabase
        .from('course_referrals')
        .update({
          payout_status: 'paid',
          paid_at: new Date().toISOString(),
          stripe_transfer_id: transfer.id,
        })
        .in('id', batch.ids)

      paidCount += batch.ids.length
    } catch (err) {
      console.error(`[referral-payouts] course ${courseId} failed`, err)
    }
  }

  await markExpired(supabase)

  return NextResponse.json({ paid: paidCount })
}

async function markExpired(supabase: ReturnType<typeof createAdminClient>) {
  await supabase
    .from('course_referrals')
    .update({ payout_status: 'expired' })
    .eq('payout_status', 'pending')
    .lt('expires_at', new Date().toISOString())
}
