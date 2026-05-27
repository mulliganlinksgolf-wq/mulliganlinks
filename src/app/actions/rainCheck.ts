'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { sendRainCheckEmail } from '@/lib/emails'

export async function issueRainCheck({
  memberId,
  courseId,
  amountCents,
  note,
}: {
  memberId: string
  courseId: string
  amountCents: number
  note?: string
}): Promise<{ error?: string; code?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify caller is an admin of this course
  const { data: adminRow } = await supabase
    .from('course_admins')
    .select('course_id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle()

  if (!adminRow) return { error: 'Not authorized for this course' }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('rain_checks')
    .insert({
      user_id: memberId,
      course_id: courseId,
      issued_by: user.id,
      amount_cents: amountCents,
      note: note ?? null,
    })
    .select('code')
    .single()

  if (error || !data) return { error: 'Failed to issue rain check' }

  // Fire-and-forget — member gets their code by email too
  sendRainCheckEmail({
    userId: memberId,
    courseName: (await createAdminClient().from('courses').select('name').eq('id', courseId).single()).data?.name ?? 'the course',
    code: data.code,
    amountCents,
    note,
  }).catch(() => {})

  revalidatePath('/course/[slug]', 'page')
  return { code: data.code }
}

export async function lookupRainCheck(code: string): Promise<{
  id?: string
  amountCents?: number
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()
  const { data } = await admin
    .from('rain_checks')
    .select('id, amount_cents, status, expires_at, user_id')
    .eq('code', code.toUpperCase().trim())
    .maybeSingle()

  if (!data) return { error: 'Rain check not found' }
  if (data.user_id !== user.id) return { error: 'This rain check belongs to a different account' }
  if (data.status !== 'available') return { error: 'Rain check already used or expired' }
  if (new Date(data.expires_at) < new Date()) return { error: 'Rain check has expired' }

  return { id: data.id, amountCents: data.amount_cents }
}

export async function redeemRainCheck(
  rainCheckId: string,
  bookingId: string,
): Promise<{ error?: string }> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('rain_checks')
    .update({ status: 'redeemed', redeemed_booking_id: bookingId })
    .eq('id', rainCheckId)
    .eq('status', 'available')

  if (error) return { error: 'Failed to redeem rain check' }
  return {}
}
