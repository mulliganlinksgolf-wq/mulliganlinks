'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendCourseWaitlistConfirmation, sendCourseAdminAlert } from '@/lib/resend'
import { verifyRecaptcha } from '@/lib/recaptcha'

export async function joinCourseWaitlist(formData: FormData) {
  const recaptchaToken = (formData.get('recaptcha_token') as string) ?? ''
  const isHuman = await verifyRecaptcha(recaptchaToken)
  if (!isHuman) {
    return { error: 'reCAPTCHA verification failed. Please try again.' }
  }

  const courseName = (formData.get('course_name') as string)?.trim()
  const contactName = (formData.get('contact_name') as string)?.trim()
  const contactRole = (formData.get('contact_role') as string)?.trim() || null
  const email = (formData.get('email') as string)?.toLowerCase().trim()
  const phone = (formData.get('phone') as string)?.trim() || null
  const city = (formData.get('city') as string)?.trim() || null
  const state = (formData.get('state') as string)?.trim().toUpperCase() || null
  const numHoles = formData.get('num_holes') ? parseInt(formData.get('num_holes') as string, 10) : null
  const annualRounds = formData.get('annual_rounds') ? parseInt(formData.get('annual_rounds') as string, 10) : null
  const currentSoftware = (formData.get('current_software') as string) || null
  const onGolfnow = formData.get('on_golfnow') === 'yes'
  const avgGreenFee = formData.get('avg_green_fee') ? parseInt(formData.get('avg_green_fee') as string, 10) : null
  const biggestFrustration = (formData.get('biggest_frustration') as string)?.trim() || null
  const rawTier = (formData.get('applied_tier') as string)?.trim() || null
  const appliedTier = rawTier === 'standard' ? 'standard' : 'founding'

  if (!courseName || !contactName || !email || !email.includes('@')) {
    return { error: 'Course name, contact name, and a valid email are required.' }
  }

  const estimatedBarterCost =
    onGolfnow && avgGreenFee && !isNaN(avgGreenFee) ? 2 * avgGreenFee * 300 : null

  const supabase = createAdminClient()

  const { error } = await supabase.from('course_waitlist').insert({
    course_name: courseName,
    contact_name: contactName,
    contact_role: contactRole,
    email,
    phone,
    city,
    state,
    num_holes: numHoles,
    annual_rounds: annualRounds,
    current_software: currentSoftware,
    on_golfnow: onGolfnow,
    estimated_barter_cost: estimatedBarterCost,
    biggest_frustration: biggestFrustration,
    applied_tier: appliedTier,
    status: 'pending',
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'We already have an application from this email address.' }
    }
    console.error('[course-waitlist]', error)
    return { error: 'Something went wrong. Please try again.' }
  }

  await Promise.all([
    sendCourseWaitlistConfirmation({ email, contactName, courseName }),
    sendCourseAdminAlert({
      courseName,
      contactName,
      contactRole,
      email,
      phone,
      city,
      state,
      onGolfnow,
      estimatedBarterCost,
      biggestFrustration,
    }),
  ])

  return { success: true }
}
