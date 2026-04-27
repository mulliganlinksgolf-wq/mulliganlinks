'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendGoLiveAlert } from '@/lib/email/sendGoLiveAlert'
import { sendCourseWelcome } from '@/lib/email/sendCourseWelcome'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Step1Data = {
  name: string
  legalEntityName: string
  gmName: string
  email: string
  phone: string
  billingEmail: string
  website: string
  address: string
  city: string
  state: string
  zip: string
  taxId: string
  holes: number
}

export type Step2Data = {
  intervalMinutes: number
  maxPlayers: number
  advanceBookingDays: number
  cartPolicy: 'mandatory' | 'optional' | 'walking_only'
  hours: Array<{
    dayOfWeek: number
    isOpen: boolean
    openTime: string
    closeTime: string
  }>
}

export type Step3Data = {
  pricing: Array<{
    rateName: string
    greenFeeCents: number
    cartFeeCents: number
    displayOrder: number
  }>
  cancellationWindowMinutes: number
  rainCheckPolicy: 'full_credit' | 'half_credit' | 'none'
}

export type Step4Data = {
  description: string
  amenities: string[]
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function saveStep1(
  courseId: string,
  data: Step1Data,
): Promise<{ courseId: string }> {
  const supabase = createAdminClient()

  const fields = {
    name: data.name.trim(),
    legal_entity_name: data.legalEntityName.trim(),
    gm_name: data.gmName.trim(),
    email: data.email.trim(),
    phone: data.phone.trim(),
    billing_email: data.billingEmail.trim(),
    website: data.website.trim(),
    address: data.address.trim(),
    city: data.city.trim(),
    state: data.state.trim(),
    zip: data.zip.trim(),
    tax_id: data.taxId.trim(),
    holes: data.holes,
  }

  const { error } = await supabase
    .from('courses')
    .update({ ...fields, onboarding_step: 2 })
    .eq('id', courseId)

  if (error) throw new Error('Failed to save step 1: ' + error.message)
  return { courseId }
}

export async function saveStep2(courseId: string, data: Step2Data): Promise<void> {
  const supabase = createAdminClient()

  const { error: configError } = await supabase
    .from('course_tee_sheet_config')
    .upsert(
      {
        course_id: courseId,
        interval_minutes: data.intervalMinutes,
        max_players: data.maxPlayers,
        advance_booking_days: data.advanceBookingDays,
        cart_policy: data.cartPolicy,
      },
      { onConflict: 'course_id' },
    )

  if (configError) throw new Error('Failed to save step 2 config: ' + configError.message)

  const { error: deleteError } = await supabase
    .from('course_hours')
    .delete()
    .eq('course_id', courseId)

  if (deleteError) throw new Error('Failed to save step 2 hours (delete): ' + deleteError.message)

  const hoursRows = data.hours.map((h) => ({
    course_id: courseId,
    day_of_week: h.dayOfWeek,
    is_open: h.isOpen,
    open_time: h.openTime,
    close_time: h.closeTime,
  }))

  const { error: insertError } = await supabase.from('course_hours').insert(hoursRows)

  if (insertError) throw new Error('Failed to save step 2 hours (insert): ' + insertError.message)

  const { error: stepError } = await supabase
    .from('courses')
    .update({ onboarding_step: 3 })
    .eq('id', courseId)

  if (stepError) throw new Error('Failed to save step 2 step: ' + stepError.message)
}

export async function saveStep3(courseId: string, data: Step3Data): Promise<void> {
  if (data.pricing.length === 0) throw new Error('At least one pricing row is required')
  if (data.pricing.some((p) => p.greenFeeCents < 0 || p.cartFeeCents < 0))
    throw new Error('Fees cannot be negative')

  const supabase = createAdminClient()

  const { error: deleteError } = await supabase
    .from('course_pricing')
    .delete()
    .eq('course_id', courseId)

  if (deleteError) throw new Error('Failed to save step 3 pricing (delete): ' + deleteError.message)

  const pricingRows = data.pricing.map((p) => ({
    course_id: courseId,
    rate_name: p.rateName,
    green_fee_cents: p.greenFeeCents,
    cart_fee_cents: p.cartFeeCents,
    display_order: p.displayOrder,
    is_active: true,
  }))

  const { error: insertError } = await supabase.from('course_pricing').insert(pricingRows)

  if (insertError) throw new Error('Failed to save step 3 pricing (insert): ' + insertError.message)

  const { error: configError } = await supabase
    .from('course_tee_sheet_config')
    .upsert(
      {
        course_id: courseId,
        cancellation_window_minutes: data.cancellationWindowMinutes,
        rain_check_policy: data.rainCheckPolicy,
      },
      { onConflict: 'course_id' },
    )

  if (configError) throw new Error('Failed to save step 3 config: ' + configError.message)

  const { error: stepError } = await supabase
    .from('courses')
    .update({ onboarding_step: 4 })
    .eq('id', courseId)

  if (stepError) throw new Error('Failed to save step 3 step: ' + stepError.message)
}

export async function saveStep4(courseId: string, data: Step4Data): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('courses')
    .update({
      description: data.description.trim(),
      amenities: data.amenities,
      onboarding_step: 5,
    })
    .eq('id', courseId)

  if (error) throw new Error('Failed to save step 4: ' + error.message)
}

export async function goLive(courseId: string): Promise<void> {
  const supabase = createAdminClient()

  const { data: course, error: fetchError } = await supabase
    .from('courses')
    .select('id, name, slug, city, state, gm_name, email, phone, website, holes')
    .eq('id', courseId)
    .single()

  if (fetchError) throw new Error('Failed to fetch course for go-live: ' + fetchError.message)

  const { error: updateError } = await supabase
    .from('courses')
    .update({
      is_live: true,
      invite_used: true,
      onboarding_complete: true,
      onboarding_step: 6,
      status: 'active',
    })
    .eq('id', courseId)

  if (updateError) throw new Error('Failed to go live: ' + updateError.message)

  // Email failures must not block the go-live state — DB write is the source of truth
  try {
    await Promise.all([sendGoLiveAlert(course), sendCourseWelcome(course)])
  } catch (err) {
    console.error('[goLive] email send failed (course is still live):', err)
  }
}
