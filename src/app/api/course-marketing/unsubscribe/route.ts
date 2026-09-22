import { createAdminClient } from '@/lib/supabase/admin'
import { UUID } from '@/lib/course-marketing/content'
export const runtime = 'nodejs'
function page(content: string, status = 200) {
  return new Response(
    `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Course email preferences | TeeAhead</title></head><body style="font-family:Arial,sans-serif;background:#faf7f2;color:#1a3025;padding:40px 20px"><main style="max-width:480px;margin:auto;background:white;padding:32px;border-radius:16px">${content}</main></body></html>`,
    {
      status,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
        'X-Robots-Tag': 'noindex',
        'Content-Security-Policy':
          "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'",
      },
    },
  )
}
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token') ?? ''
  if (!UUID.test(token))
    return page(
      '<h1>This link is invalid</h1><p>Use the unsubscribe link in your course email.</p>',
      400,
    )
  // GET never changes preferences: email scanners and link previews may visit it.
  return page(
    `<h1>Unsubscribe from course updates?</h1><p>Booking and account emails will still arrive.</p><form method="post"><button style="background:#1b4332;color:white;border:0;padding:14px;border-radius:8px">Unsubscribe</button></form>`,
  )
}
export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get('token') ?? ''
  if (!UUID.test(token)) return page('<h1>This link is invalid</h1>', 400)
  const { data, error } = await createAdminClient()
    .from('course_email_subscriptions')
    .update({ subscribed: false, updated_at: new Date().toISOString() })
    .eq('unsubscribe_token', token)
    .select('id')
    .maybeSingle()
  if (error)
    return page(
      '<h1>Please try again</h1><p>Your preference could not be saved.</p>',
      503,
    )
  if (!data) return page('<h1>This link is no longer valid</h1>', 404)
  return page(
    '<h1>You’re unsubscribed</h1><p>You won’t receive more promotional emails from this course. Booking and account emails will still arrive.</p>',
  )
}
