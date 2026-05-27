import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { createAdminClient } from '@/lib/supabase/admin'

export function parseOpenEvent(body: unknown): { emailId: string } | null {
  if (
    typeof body !== 'object' ||
    body === null ||
    (body as Record<string, unknown>).type !== 'email.opened'
  ) return null

  const data = (body as Record<string, unknown>).data as Record<string, unknown> | undefined
  const emailId = data?.email_id
  if (typeof emailId !== 'string' || !emailId) return null
  return { emailId }
}

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) {
    console.error('[resend-webhook] RESEND_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  const body = await req.text()
  const headers = {
    'svix-id':        req.headers.get('svix-id') ?? '',
    'svix-timestamp': req.headers.get('svix-timestamp') ?? '',
    'svix-signature': req.headers.get('svix-signature') ?? '',
  }

  let payload: Record<string, unknown>
  try {
    const wh = new Webhook(secret)
    payload = wh.verify(body, headers) as Record<string, unknown>
  } catch (err) {
    console.error('[resend-webhook] signature verify failed:', (err as Error).message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log('[resend-webhook] event received:', payload.type)

  const parsed = parseOpenEvent(payload)
  if (!parsed) {
    console.log('[resend-webhook] not an open event, ignoring')
    return NextResponse.json({ received: true })
  }

  const { emailId } = parsed
  console.log('[resend-webhook] looking up activity for email_id:', emailId)

  const admin = createAdminClient()
  const { data: activity, error: lookupError } = await admin
    .from('crm_activity_log')
    .select('id, opened_at, open_count, created_at')
    .eq('resend_email_id', emailId)
    .single()

  if (lookupError) {
    console.error('[resend-webhook] lookup error:', lookupError.message)
  }

  if (activity) {
    // Filter out the sender's own self-opens. When you send a test and immediately
    // open your own sent message to verify it landed, the tracking pixel fires from
    // your IP — that's not real engagement. Anything within 30 seconds of send is
    // almost certainly the sender checking their own work.
    const sentAt = new Date(activity.created_at).getTime()
    const now = Date.now()
    const secondsSinceSend = (now - sentAt) / 1000
    const SELF_OPEN_WINDOW_SECONDS = 30

    if (secondsSinceSend < SELF_OPEN_WINDOW_SECONDS) {
      console.log(`[resend-webhook] skipping self-open (${secondsSinceSend.toFixed(1)}s after send) for activity ${activity.id}`)
      return NextResponse.json({ received: true, skipped: 'self_open' })
    }

    console.log('[resend-webhook] updating activity:', activity.id)
    const { error: updateError } = await admin
      .from('crm_activity_log')
      .update({
        opened_at: activity.opened_at ?? new Date().toISOString(),
        open_count: (activity.open_count ?? 0) + 1,
      })
      .eq('id', activity.id)

    if (updateError) {
      console.error('[resend-webhook] DB update failed:', updateError.message)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }
    console.log('[resend-webhook] activity updated successfully')
  } else {
    console.log('[resend-webhook] no matching activity found for email_id:', emailId)
  }

  return NextResponse.json({ received: true })
}

/*
 * MANUAL SETUP REQUIRED (after deployment):
 * 1. Go to resend.com → Webhooks → Add Endpoint
 * 2. URL: https://teeahead.com/api/webhooks/resend
 * 3. Subscribe to: email.opened only
 * 4. Copy Signing Secret → set as RESEND_WEBHOOK_SECRET in Vercel env vars
 */
