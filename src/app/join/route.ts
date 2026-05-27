import { type NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const COOKIE_NAME = 'ta_ref'
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 // 30 days

export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get('ref')
  const dest = new URL('/waitlist/golfer', request.nextUrl.origin)

  const response = NextResponse.redirect(dest, 302)

  if (ref) {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('courses')
      .select('id')
      .eq('referral_code', ref)
      .eq('status', 'active')
      .single()

    if (data) {
      response.cookies.set(COOKIE_NAME, ref, {
        maxAge: COOKIE_MAX_AGE,
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
      })
    }
  }

  return response
}
