'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  PartnerPreferences,
  TimePreference,
  HolePreference,
} from '@/types/partners'

async function requireEagleOrAce() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' as string, user: null, supabase: null }
  const { data: membership } = await supabase
    .from('memberships')
    .select('tier')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()
  const tier = membership?.tier ?? 'fairway'
  if (tier === 'fairway') {
    return { error: 'Upgrade to Eagle or Ace to use the Partner Finder.', user: null, supabase: null }
  }
  return { error: null, user, supabase }
}

export async function upsertPartnerPreferences(
  data: Partial<Omit<PartnerPreferences, 'id' | 'profile_id' | 'updated_at'>>
): Promise<{ error?: string }> {
  const { error: tierError, user, supabase } = await requireEagleOrAce()
  if (tierError) return { error: tierError }

  if (data.bio && data.bio.length > 280) {
    return { error: 'Bio must be 280 characters or fewer.' }
  }

  const { error } = await supabase!
    .from('partner_preferences')
    .upsert(
      { ...data, profile_id: user!.id, updated_at: new Date().toISOString() },
      { onConflict: 'profile_id' }
    )

  if (error) return { error: error.message }
  revalidatePath('/app/partners/preferences')
  return {}
}

export async function upsertAvailability(data: {
  available_date: string
  time_preference: TimePreference
  course_id?: string
  holes: HolePreference
  notes?: string
}): Promise<{ error?: string }> {
  const { error: tierError, user, supabase } = await requireEagleOrAce()
  if (tierError) return { error: tierError }

  const todayUTC = new Date()
  todayUTC.setUTCHours(0, 0, 0, 0)
  const selectedUTC = new Date(data.available_date + 'T00:00:00Z')
  if (selectedUTC < todayUTC) return { error: 'Cannot add availability for a past date.' }

  const sixtyDaysOut = new Date(todayUTC)
  sixtyDaysOut.setUTCDate(sixtyDaysOut.getUTCDate() + 60)
  if (selectedUTC > sixtyDaysOut) return { error: 'Availability can only be set up to 60 days in advance.' }

  if (data.notes && data.notes.length > 140) {
    return { error: 'Notes must be 140 characters or fewer.' }
  }

  const { count } = await supabase!
    .from('partner_availability')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', user!.id)
    .eq('is_active', true)
    .gte('available_date', todayUTC.toISOString().slice(0, 10))

  if ((count ?? 0) >= 7) {
    return { error: 'You can have at most 7 upcoming availability slots. Delete one to add another.' }
  }

  const { error } = await supabase!.from('partner_availability').insert({
    profile_id: user!.id,
    available_date: data.available_date,
    time_preference: data.time_preference,
    course_id: data.course_id ?? null,
    holes: data.holes,
    notes: data.notes ?? null,
  })

  if (error) return { error: error.message }
  revalidatePath('/app/partners/my-availability')
  return {}
}

export async function deleteAvailability(
  availabilityId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('partner_availability')
    .update({ is_active: false })
    .eq('id', availabilityId)
    .eq('profile_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/app/partners/my-availability')
  return {}
}

export async function sendConnectionRequest(
  recipientId: string,
  availabilityId: string,
  message?: string
): Promise<{ error?: string }> {
  const { error: tierError, user, supabase } = await requireEagleOrAce()
  if (tierError) return { error: tierError }

  if (message && message.length > 280) {
    return { error: 'Message must be 280 characters or fewer.' }
  }

  // Check block — silently succeed if blocked (don't reveal the block)
  const { data: blocked } = await supabase!.rpc('is_blocked', {
    user_a: user!.id,
    user_b: recipientId,
  })
  if (blocked) return {}

  const { error } = await supabase!.from('partner_connection_requests').insert({
    requester_id: user!.id,
    recipient_id: recipientId,
    availability_id: availabilityId,
    message: message ?? null,
  })

  if (error) {
    if (error.code === '23505') return { error: 'You already sent a request for this availability.' }
    return { error: error.message }
  }

  // Send notification email (best-effort, non-fatal)
  try {
    const { sendPartnerRequestEmail } = await import('@/lib/resend') as any
    const [{ data: requesterProfile }, { data: availability }] = await Promise.all([
      supabase!.from('profiles').select('full_name').eq('id', user!.id).single(),
      supabase!.from('partner_availability').select('available_date').eq('id', availabilityId).single(),
    ])
    const adminClient = (await import('@/lib/supabase/admin')).createAdminClient()
    const { data: { user: recipientAuthUser } } = await adminClient.auth.admin.getUserById(recipientId)
    if (recipientAuthUser?.email) {
      const requesterFirstName = (requesterProfile?.full_name ?? '').split(' ')[0] || 'Someone'
      await sendPartnerRequestEmail({
        requesterName: requesterFirstName,
        recipientEmail: recipientAuthUser.email,
        availabilityDate: availability?.available_date ?? '',
        message,
      })
    }
  } catch (err) {
    console.error('[partner-finder] Failed to send notification email:', err)
  }

  revalidatePath('/app/partners/requests')
  return {}
}

export async function respondToRequest(
  requestId: string,
  status: 'accepted' | 'declined'
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('partner_connection_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('recipient_id', user.id)

  if (error) return { error: error.message }

  if (status === 'accepted') {
    try {
      const { sendPartnerRequestAcceptedEmail } = await import('@/lib/resend') as any
      const { data: req } = await supabase
        .from('partner_connection_requests')
        .select('requester_id, availability_id')
        .eq('id', requestId)
        .single()
      if (req) {
        const [{ data: recipientProfile }, { data: availability }] = await Promise.all([
          supabase.from('profiles').select('full_name').eq('id', user.id).single(),
          req.availability_id
            ? supabase.from('partner_availability').select('available_date').eq('id', req.availability_id).single()
            : Promise.resolve({ data: null }),
        ])
        const adminClient = (await import('@/lib/supabase/admin')).createAdminClient()
        const { data: { user: requesterAuthUser } } = await adminClient.auth.admin.getUserById(req.requester_id)
        if (requesterAuthUser?.email) {
          await sendPartnerRequestAcceptedEmail({
            recipientName: (recipientProfile?.full_name ?? '').split(' ')[0] || 'Your partner',
            requesterEmail: requesterAuthUser.email,
            availabilityDate: (availability as any)?.available_date ?? '',
          })
        }
      }
    } catch (err) {
      console.error('[partner-finder] Failed to send notification email:', err)
    }
  }

  revalidatePath('/app/partners/requests')
  return {}
}

export async function withdrawRequest(
  requestId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('partner_connection_requests')
    .update({ status: 'withdrawn', updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('requester_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/app/partners/requests')
  return {}
}

export async function blockMember(
  blockedId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error: blockError } = await supabase
    .from('partner_blocks')
    .insert({ blocker_id: user.id, blocked_id: blockedId })

  if (blockError && blockError.code !== '23505') return { error: blockError.message }

  // Decline any pending requests between the two users
  await supabase
    .from('partner_connection_requests')
    .update({ status: 'declined', updated_at: new Date().toISOString() })
    .eq('status', 'pending')
    .eq('requester_id', user.id)
    .eq('recipient_id', blockedId)

  await supabase
    .from('partner_connection_requests')
    .update({ status: 'declined', updated_at: new Date().toISOString() })
    .eq('status', 'pending')
    .eq('requester_id', blockedId)
    .eq('recipient_id', user.id)

  revalidatePath('/app/partners')
  return {}
}

export async function uploadAvatar(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const file = formData.get('avatar') as File | null
  if (!file || file.size === 0) return { error: 'No file provided.' }
  if (file.size > 5 * 1024 * 1024) return { error: 'Photo must be under 5 MB.' }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return { error: 'Only JPEG, PNG, or WebP photos are supported.' }
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${user.id}/avatar.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id)

  if (updateError) return { error: updateError.message }

  revalidatePath('/app/partners/preferences')
  revalidatePath('/app/partners')
  return { url: publicUrl }
}

export async function markBooked(
  requestId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  // Fetch the request to determine if user is requester or recipient
  const { data: req } = await supabase
    .from('partner_connection_requests')
    .select('id, requester_id, recipient_id, availability_id, requester_booked, recipient_booked')
    .eq('id', requestId)
    .eq('status', 'accepted')
    .single()

  if (!req) return { error: 'Request not found.' }

  const isRequester = req.requester_id === user.id
  const isRecipient = req.recipient_id === user.id
  if (!isRequester && !isRecipient) return { error: 'Forbidden.' }

  const field = isRequester ? 'requester_booked' : 'recipient_booked'

  const { error: updateError } = await supabase
    .from('partner_connection_requests')
    .update({ [field]: true })
    .eq('id', requestId)

  if (updateError) return { error: updateError.message }

  // Auto-detect tee time from bookings on the availability date (best-effort)
  let teeTime: string | null = null
  let courseName: string | null = null
  if (req.availability_id) {
    const { data: avail } = await supabase
      .from('partner_availability')
      .select('available_date')
      .eq('id', req.availability_id)
      .single()

    if (avail?.available_date) {
      const { data: booking } = await supabase
        .from('bookings')
        .select('tee_times!inner(scheduled_at, courses(name))')
        .eq('user_id', user.id)
        .neq('status', 'canceled')
        .gte('tee_times.scheduled_at', avail.available_date + 'T00:00:00Z')
        .lte('tee_times.scheduled_at', avail.available_date + 'T23:59:59Z')
        .order('tee_times.scheduled_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      const tt = (booking as any)?.tee_times
      if (tt?.scheduled_at) {
        teeTime = new Date(tt.scheduled_at).toLocaleTimeString('en-US', {
          hour: 'numeric', minute: '2-digit', timeZone: 'America/Detroit',
        })
      }
      if (tt?.courses?.name) courseName = tt.courses.name

      // Send notification email to the other party
      try {
        const { sendPartnerBookedEmail } = await import('@/lib/resend') as any
        const otherId = isRequester ? req.recipient_id : req.requester_id
        const adminClient = (await import('@/lib/supabase/admin')).createAdminClient()
        const [{ data: bookerProfile }, { data: { user: otherAuthUser } }] = await Promise.all([
          supabase.from('profiles').select('full_name').eq('id', user.id).single(),
          adminClient.auth.admin.getUserById(otherId),
        ])
        if (otherAuthUser?.email) {
          await sendPartnerBookedEmail({
            bookerName: (bookerProfile?.full_name ?? '').split(' ')[0] || 'Your partner',
            otherEmail: otherAuthUser.email,
            availabilityDate: avail.available_date,
            teeTime,
            courseName,
          })
        }
      } catch (err) {
        console.error('[partner-finder] Failed to send booked notification email:', err)
      }
    }
  }

  revalidatePath('/app/partners/requests')
  return {}
}

export async function submitRating(
  connectionRequestId: string,
  rateeId: string,
  stars: number,
  comment?: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }
  if (stars < 1 || stars > 5) return { error: 'Stars must be between 1 and 5.' }
  if (comment && comment.length > 280) return { error: 'Comment must be 280 characters or fewer.' }

  const { error } = await supabase.from('partner_ratings').insert({
    rater_id: user.id,
    ratee_id: rateeId,
    connection_request_id: connectionRequestId,
    stars,
    comment: comment ?? null,
  })

  if (error) {
    if (error.code === '23505') return { error: 'You already rated this round.' }
    return { error: error.message }
  }

  revalidatePath('/app/partners/requests')
  return {}
}
