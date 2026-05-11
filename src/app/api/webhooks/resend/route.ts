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
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const parsed = parseOpenEvent(payload)
  if (!parsed) {
    return NextResponse.json({ received: true })
  }

  const { emailId } = parsed

  const admin = createAdminClient()
  const { data: activity } = await admin
    .from('crm_activity_log')
    .select('id, opened_at, open_count')
    .eq('resend_email_id', emailId)
    .single()

  if (activity) {
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
