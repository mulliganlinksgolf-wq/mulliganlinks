'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { marketingEnabled } from '@/lib/course-marketing/server'

export async function updateSubscription(
  slug: string,
  _state: { message?: string; error?: string },
  form: FormData,
): Promise<{ error?: string; message?: string }> {
  if (!marketingEnabled())
    return { error: 'Course updates are not available yet.' }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email || !user.email_confirmed_at)
    return {
      error: 'Sign in with a verified email address to manage course updates.',
    }
  const subscribed = form.get('subscribed') === 'yes'
  const admin = createAdminClient()
  const { data: course, error: courseError } = await admin
    .from('courses')
    .select('id')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()
  if (courseError || !course) return { error: 'This course is not available.' }
  const { error } = await admin.from('course_email_subscriptions').upsert(
    {
      course_id: course.id,
      user_id: user.id,
      email: user.email.trim().toLowerCase(),
      subscribed,
      ...(subscribed ? { consent_at: new Date().toISOString() } : {}),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'course_id,user_id' },
  )
  if (error)
    return { error: 'Could not save your preference. Please try again.' }
  revalidatePath(`/course-updates/${slug}`)
  revalidatePath(`/course/${slug}/marketing`)
  return {
    message: subscribed
      ? 'You’re subscribed. Watch your inbox for course news and offers.'
      : 'You’re unsubscribed. Booking and account emails will still arrive.',
  }
}
