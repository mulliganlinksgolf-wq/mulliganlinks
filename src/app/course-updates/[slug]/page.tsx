import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { marketingEnabled } from '@/lib/course-marketing/server'
import SubscriptionForm from './SubscriptionForm'
export const metadata = {
  title: 'Course email updates | TeeAhead',
  robots: { index: false, follow: false },
}
export default async function CourseUpdatesPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (!marketingEnabled())
    return (
      <main className="p-10 text-center">
        Course email updates will be available soon.
      </main>
    )
  const admin = createAdminClient()
  const supabase = await createClient()
  const [courseResult, userResult] = await Promise.all([
    admin
      .from('courses')
      .select('id,name')
      .eq('slug', slug)
      .eq('status', 'active')
      .single(),
    supabase.auth.getUser(),
  ])
  if (courseResult.error && courseResult.error.code !== 'PGRST116')
    throw new Error('Course updates are temporarily unavailable.')
  const course = courseResult.data
  if (!course) notFound()
  const user = userResult.data.user
  let subscribed = false
  if (user) {
    const result = await admin
      .from('course_email_subscriptions')
      .select('subscribed')
      .eq('course_id', course.id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (result.error) throw new Error('Could not load your email preference.')
    subscribed = result.data?.subscribed ?? false
  }
  return (
    <main className="min-h-screen bg-[#FAF7F2] px-4 py-16 text-[#1A3025]">
      <section className="max-w-lg mx-auto rounded-2xl bg-white border border-black/10 p-6 sm:p-9 space-y-6">
        <p className="text-xs uppercase tracking-widest text-[#6B7770]">
          Course updates · TeeAhead
        </p>
        <h1 className="text-3xl font-semibold">
          Stay in the loop at {course.name}
        </h1>
        <p className="text-[#6B7770]">
          Get the latest on open tee times, leagues, and offers from your
          course—even between seasons.
        </p>
        {user ? (
          <SubscriptionForm
            slug={slug}
            subscribed={subscribed}
            email={user.email ?? ''}
          />
        ) : (
          <div className="space-y-3">
            <Link
              className="block text-center bg-[#1B4332] text-white rounded-lg p-3 font-semibold"
              href={`/login?next=${encodeURIComponent(`/course-updates/${slug}`)}`}
            >
              Sign in to subscribe
            </Link>
            <p className="text-sm text-[#6B7770]">
              New to TeeAhead?{' '}
              <Link href="/signup" className="underline">
                Create a free account
              </Link>
              , then return to this page to subscribe.
            </p>
          </div>
        )}
        <p className="text-xs text-[#6B7770]">
          Your choice applies only to {course.name}. Booking confirmations and
          account messages aren’t affected.
        </p>
      </section>
    </main>
  )
}
