import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { getResend } from '@/lib/resend'
import { renderCampaign } from './content'

export function marketingOrigin() {
  const url = new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://www.teeahead.com',
  )
  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:')
    throw new Error('Email links need an HTTPS app URL.')
  return url.origin
}
export function marketingEnabled() {
  return process.env.COURSE_MARKETING_ENABLED === 'true'
}

// A global two-minute lease prevents overlapping workers. Each invocation is bounded
// to 40 messages / 45 seconds; the next tick resumes persisted pending rows.
export async function processCourseMarketing() {
  if (!marketingEnabled()) return { disabled: true }
  const resend = getResend()
  if (!resend) throw new Error('Email delivery is not configured.')
  const origin = marketingOrigin()
  const admin = createAdminClient()
  const { data: claimed, error: claimError } = await admin.rpc(
    'claim_course_email_worker',
  )
  if (claimError) throw new Error(claimError.message)
  if (!claimed) return { busy: true }
  const started = Date.now()
  const { data: rows, error } = await admin
    .from('course_email_deliveries')
    .select('*, course_email_campaigns!inner(*)')
    .eq('status', 'pending')
    .order('id')
    .limit(40)
  if (error) throw new Error(error.message)
  let sent = 0
  for (const row of rows ?? []) {
    if (Date.now() - started > 45000) break
    const campaign = row.course_email_campaigns
    // Recheck consent immediately before delivery, including changes since enqueue.
    const [subscriptionResult, campaignResult] = await Promise.all([
      admin
        .from('course_email_subscriptions')
        .select('subscribed,email')
        .eq('id', row.subscription_id)
        .single(),
      admin
        .from('course_email_campaigns')
        .select('status')
        .eq('id', row.campaign_id)
        .single(),
    ])
    if (subscriptionResult.error || campaignResult.error)
      throw new Error('Could not verify current sending preferences.')
    let status = 'pending',
      failure: string | null = null,
      providerId: string | null = null
    if (
      !subscriptionResult.data?.subscribed ||
      subscriptionResult.data.email !== row.email ||
      campaignResult.data?.status === 'cancelled'
    ) {
      status = 'skipped'
    } else if (
      row.attempts >= 5 ||
      (row.first_attempt_at &&
        Date.now() - Date.parse(row.first_attempt_at) > 20 * 3600000)
    ) {
      // Resend retains idempotency keys for 24h. Never replay an uncertain send beyond it.
      status = 'failed'
      failure =
        'Delivery could not be confirmed. Automatic retries stopped to prevent duplicates.'
    } else {
      const { error: attemptError } = await admin
        .from('course_email_deliveries')
        .update({
          attempts: row.attempts + 1,
          first_attempt_at: row.first_attempt_at ?? new Date().toISOString(),
        })
        .eq('id', row.id)
      if (attemptError) throw new Error(attemptError.message)
      const unsubscribeUrl = `${origin}/api/course-marketing/unsubscribe?token=${row.unsubscribe_token}`
      try {
        const result = await resend.emails.send(
          {
            from: 'TeeAhead Course Updates <hello@teeahead.com>',
            to: row.email,
            subject: campaign.subject,
            html: renderCampaign({
              sender: campaign.sender_name,
              address: campaign.postal_address,
              body: campaign.body,
              unsubscribeUrl,
            }),
            text: `${campaign.sender_name}\n\n${campaign.body}\n\n${campaign.postal_address}\nUnsubscribe: ${unsubscribeUrl}`,
            headers: {
              'List-Unsubscribe': `<${unsubscribeUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
          },
          { idempotencyKey: `course-email/${row.id}` },
        )
        if (result.error || !result.data?.id)
          failure =
            result.error?.message ?? 'Provider did not confirm acceptance.'
        else {
          status = 'sent'
          providerId = result.data.id
          sent++
        }
      } catch {
        failure = 'Email provider temporarily unavailable.'
      }
      if (failure && row.attempts + 1 >= 5) status = 'failed'
      // Stay below Resend's default request rate even for large lists.
      await new Promise((resolve) => setTimeout(resolve, 600))
    }
    const { error: saveError } = await admin
      .from('course_email_deliveries')
      .update({ status, error: failure, provider_id: providerId })
      .eq('id', row.id)
    if (saveError) throw new Error(saveError.message)
  }
  for (const id of new Set((rows ?? []).map((r) => r.campaign_id))) {
    const { count, error: countError } = await admin
      .from('course_email_deliveries')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', id)
      .eq('status', 'pending')
    if (countError) throw new Error(countError.message)
    if (count === 0) {
      const { error: finishError } = await admin
        .from('course_email_campaigns')
        .update({ status: 'complete' })
        .eq('id', id)
        .eq('status', 'queued')
      if (finishError) throw new Error(finishError.message)
    }
  }
  // Let the lease expire rather than releasing a lock another worker could own.
  return { sent }
}
