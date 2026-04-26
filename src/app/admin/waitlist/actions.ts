'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendFoundingPartnerApproval, sendBarterReceipt } from '@/lib/resend'

const ADMIN_EMAILS = ['mulliganlinksgolf@gmail.com', 'nbarris11@gmail.com', 'beslock@yahoo.com']

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
    redirect('/login')
  }
}

export async function approveFoundingPartner(courseId: number) {
  await requireAdmin()

  const adminClient = createAdminClient()

  const { data: course, error: fetchError } = await adminClient
    .from('course_waitlist')
    .select('course_name, contact_name, email')
    .eq('id', courseId)
    .single()

  if (fetchError || !course) {
    return { error: 'Course not found.' }
  }

  const { data, error } = await adminClient.rpc('approve_founding_partner', {
    p_course_id: courseId,
  })

  if (error) {
    console.error('[approve-founding-partner]', error)
    return { error: error.message ?? 'Failed to approve.' }
  }

  const result = data as { error?: string; founding_partner_number?: number }

  if (result.error) {
    return { error: result.error }
  }

  const partnerNumber = result.founding_partner_number!

  await sendFoundingPartnerApproval({
    email: course.email,
    contactName: course.contact_name,
    courseName: course.course_name,
    partnerNumber,
  })

  return { success: true, partnerNumber }
}

export async function sendBarterReceiptAction(courseId: number) {
  await requireAdmin()

  const adminClient = createAdminClient()
  const { data: course, error } = await adminClient
    .from('course_waitlist')
    .select('course_name, contact_name, email, founding_partner_number, estimated_barter_cost, approved_at')
    .eq('id', courseId)
    .eq('is_founding_partner', true)
    .single()

  if (error || !course) return { error: 'Course not found or not a Founding Partner.' }
  if (!course.estimated_barter_cost) return { error: 'No barter cost estimate on file.' }
  if (!course.approved_at) return { error: 'No approval date on record.' }

  await sendBarterReceipt({
    email: course.email,
    contactName: course.contact_name,
    courseName: course.course_name,
    partnerNumber: course.founding_partner_number,
    estimatedAnnualBarterCost: course.estimated_barter_cost,
    approvedAt: new Date(course.approved_at),
  })

  return { success: true }
}

export async function rejectCourseApplication(courseId: number) {
  await requireAdmin()

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('course_waitlist')
    .update({ status: 'rejected' })
    .eq('id', courseId)

  if (error) {
    return { error: 'Failed to reject.' }
  }

  return { success: true }
}
