import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'

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
    return NextResponse.redirect(
      new URL(`/course/${course?.slug ?? ''}/dashboard`, process.env.NEXT_PUBLIC_APP_URL!)
    )
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!
  const accountLink = await stripe.accountLinks.create({
    account: course.stripe_account_id,
    refresh_url: `${baseUrl}/api/courses/${courseId}/stripe/refresh`,
    return_url: `${baseUrl}/api/courses/${courseId}/stripe/return`,
    type: 'account_onboarding',
  })

  return NextResponse.redirect(accountLink.url)
}
