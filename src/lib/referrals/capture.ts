import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const COOKIE_NAME = 'ta_ref'
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 // 30 days

/**
 * Server-side: Validate a referral code and persist it in a 30-day cookie.
 * Silent no-op for invalid or missing codes.
 * Only sets cookie if the user hasn't opted out of tracking (DNT header).
 */
export async function captureReferralCode(code: string | null) {
  if (!code) return

  const supabase = await createClient()
  const { data } = await supabase
    .from('courses')
    .select('id, referral_code')
    .eq('referral_code', code)
    .eq('status', 'active')
    .single()

  if (!data) return // silently ignore invalid or inactive codes

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, code, {
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })
}

/** Read the active referral code from cookie (server-side). */
export async function getReferralCodeFromCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value ?? null
}

/** Clear the referral cookie after attribution is recorded. */
export async function clearReferralCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
