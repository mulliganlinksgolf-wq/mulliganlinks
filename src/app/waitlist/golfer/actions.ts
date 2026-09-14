'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendGolferWaitlistConfirmation } from '@/lib/resend'
import { verifyRecaptcha } from '@/lib/recaptcha'

export async function joinGolferWaitlist(formData: FormData) {
  const recaptchaToken = (formData.get('recaptcha_token') as string) ?? ''
  const isHuman = await verifyRecaptcha(recaptchaToken)
  if (!isHuman) {
    return { error: 'reCAPTCHA verification failed. Please try again.', reason: 'security_check' }
  }

  const email = (formData.get('email') as string)?.toLowerCase().trim()
  const firstName = (formData.get('first_name') as string)?.trim() || null
  const lastName = (formData.get('last_name') as string)?.trim() || null
  const zipCode = (formData.get('zip_code') as string)?.trim()
  const homeCourse = (formData.get('home_course') as string)?.trim() || null
  const roundsPerYear = (formData.get('rounds_per_year') as string)?.trim() || null
  const currentMembership = (formData.get('current_membership') as string)?.trim() || null
  const interestedTier = (formData.get('interested_tier') as string)?.trim() || null
  const hearAboutUs = (formData.get('hear_about_us') as string)?.trim() || null

  if (!email || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Please enter a valid email address.', reason: 'validation' }
  }
  if (!zipCode || !/^\d{5}(-\d{4})?$/.test(zipCode)) {
    return { error: 'Please enter a valid ZIP code.', reason: 'validation' }
  }

  const supabase = createAdminClient()

  const { error } = await supabase.from('golfer_waitlist').insert({
    email,
    first_name: firstName,
    last_name: lastName,
    zip_code: zipCode,
    home_course: homeCourse,
    rounds_per_year: roundsPerYear,
    current_membership: currentMembership,
    interested_tier: ['fairway', 'eagle', 'ace'].includes(interestedTier ?? '') ? interestedTier : null,
    // Store the structured hear_about_us value in referral_source for analytics
    referral_source: hearAboutUs,
  })

  if (error) {
    if (error.code === '23505') {
      return { success: true, alreadyJoined: true }
    }
    console.error('[golfer-waitlist]', error)
    return { error: 'Something went wrong. Please try again.', reason: 'save' }
  }

  // The signup is saved. Email/count failures must not turn it into a failed signup.
  try {
    const { count } = await supabase.from('golfer_waitlist').select('*', { count: 'exact', head: true })
    await sendGolferWaitlistConfirmation({ email, firstName: firstName ?? 'there', position: count ?? 1 })
  } catch {
    console.error('[golfer-waitlist] Confirmation email failed after signup was saved')
  }

  return { success: true, alreadyJoined: false }
}
