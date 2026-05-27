import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { recordReferral } from '@/app/(actions)/recordReferral'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/app'

  if (code) {
    const supabase = await createClient()
    const { data } = await supabase.auth.exchangeCodeForSession(code)

    if (data.user) {
      // Record referral attribution on first sign-in after email confirm.
      // Cookie has 30-day TTL so it's still present here.
      await recordReferral({ profileId: data.user.id }).catch(() => {})
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
