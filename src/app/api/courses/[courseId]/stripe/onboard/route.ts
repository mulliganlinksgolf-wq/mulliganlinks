import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'
import { deriveAccountStatus } from '@/lib/stripe/fees'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Verify caller is a course admin for this course
  const { data: courseAdmin } = await admin
    .from('course_admins')
    .select('id')
    .eq('course_id', courseId)
    .eq('user_id', user.id)
    .maybeSingle()

  // Also allow platform admins
  const { data: profile } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!courseAdmin && !profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: course } = await admin
    .from('courses')
    .select('id, name, slug, website, stripe_account_id, stripe_account_status')
    .eq('id', courseId)
    .single()

  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!

  let accountId = course.stripe_account_id

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        name: course.name,
        url: course.website ?? undefined,
        mcc: '7992',
      },
      settings: {
        payouts: {
          schedule: { interval: 'daily', delay_days: 7 },
        },
      },
      metadata: { course_id: course.id },
    })

    accountId = account.id

    await admin
      .from('courses')
      .update({
        stripe_account_id: accountId,
        stripe_account_status: 'onboarding',
      })
      .eq('id', courseId)
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${baseUrl}/api/courses/${courseId}/stripe/refresh`,
    return_url: `${baseUrl}/api/courses/${courseId}/stripe/return`,
    type: 'account_onboarding',
  })

  return NextResponse.json({ onboarding_url: accountLink.url })
}
