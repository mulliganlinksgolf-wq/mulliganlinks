import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'
import { deriveAccountStatus } from '@/lib/stripe/fees'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params
  const admin = createAdminClient()

  const { data: course } = await admin
    .from('courses')
    .select('id, slug, stripe_account_id')
    .eq('id', courseId)
    .single()

  if (!course?.stripe_account_id) {
    return NextResponse.redirect(new URL(`/course/${course?.slug ?? ''}/dashboard`, process.env.NEXT_PUBLIC_APP_URL!))
  }

  const account = await stripe.accounts.retrieve(course.stripe_account_id)

  await admin
    .from('courses')
    .update({
      stripe_charges_enabled: account.charges_enabled,
      stripe_payouts_enabled: account.payouts_enabled,
      stripe_details_submitted: account.details_submitted,
      stripe_account_status: deriveAccountStatus(account),
      ...(account.charges_enabled && account.payouts_enabled
        ? { stripe_onboarding_completed_at: new Date().toISOString() }
        : {}),
    })
    .eq('id', courseId)

  return NextResponse.redirect(
    new URL(`/course/${course.slug}/dashboard?stripe=return`, process.env.NEXT_PUBLIC_APP_URL!)
  )
}
