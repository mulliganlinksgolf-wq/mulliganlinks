'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendGolferWaitlistConfirmation } from '@/lib/resend'

export async function joinGolferWaitlist(formData: FormData) {
  const email = (formData.get('email') as string)?.toLowerCase().trim()
  const firstName = (formData.get('first_name') as string)?.trim()
  const lastName = (formData.get('last_name') as string)?.trim()
  const zipCode = (formData.get('zip_code') as string)?.trim()
  const homeCourse = (formData.get('home_course') as string)?.trim() || null
  const roundsPerYear = (formData.get('rounds_per_year') as string)?.trim() || null
  const currentMembership = (formData.get('current_membership') as string)?.trim() || null
  const interestedTier = (formData.get('interested_tier') as string)?.trim() || null
  const referralSource = (formData.get('referral_source') as string)?.trim() || null

  if (!email || !email.includes('@')) {
    return { error: 'Please enter a valid email address.' }
  }
  if (!firstName || !lastName) {
    return { error: 'First and last name are required.' }
  }
  if (!zipCode) {
    return { error: 'ZIP code is required.' }
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase.from('golfer_waitlist').insert({
    email,
    first_name: firstName,
    last_name: lastName,
    zip_code: zipCode,
    home_course: homeCourse,
    rounds_per_year: roundsPerYear,
    current_membership: currentMembership,
    interested_tier: interestedTier,
    referral_source: referralSource,
  }).select('id').single()

  if (error) {
    if (error.code === '23505') {
      return { error: "You're already on the list!" }
    }
    console.error('[golfer-waitlist]', error)
    return { error: 'Something went wrong. Please try again.' }
  }

  const position = data.id

  await sendGolferWaitlistConfirmation({ email, firstName, position })

  return { success: true, position }
}
