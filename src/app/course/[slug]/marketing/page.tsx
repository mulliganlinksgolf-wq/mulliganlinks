import { randomUUID } from 'node:crypto'
import { requireManager } from '@/lib/courseRole'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  marketingEnabled,
  marketingOrigin,
} from '@/lib/course-marketing/server'
import { AUDIENCES, type Audience } from '@/lib/course-marketing/content'
import CampaignComposer from './CampaignComposer'
import { cancelCampaign } from './actions'
export const metadata = { title: 'Course Marketing | TeeAhead' }
export const dynamic = 'force-dynamic'

type History = {
  id: string
  subject: string
  audience: Audience
  status: string
  created_at: string
  total: number
  sent: number
  failed: number
  skipped: number
  pending: number
}
export default async function MarketingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const ctx = await requireManager(slug)
  if (!marketingEnabled())
    return (
      <main className="p-6 sm:p-10">
        <h1 className="text-3xl font-semibold">Marketing</h1>
        <p className="mt-4">
          Course email marketing is being set up. Your TeeAhead team will enable
          it once sending is ready.
        </p>
      </main>
    )
  const admin = createAdminClient()
  const [courseResult, countsResult, historyResult] = await Promise.all([
    admin
      .from('courses')
      .select('name,address,city,state,zip')
      .eq('id', ctx.courseId)
      .single(),
    admin.rpc('course_email_counts', { p_course: ctx.courseId }),
    admin.rpc('course_email_history', { p_course: ctx.courseId }),
  ])
  if (courseResult.error || countsResult.error || historyResult.error)
    throw new Error('Could not load course marketing.')
  const course = courseResult.data!
  const counts = { all: 0, fairway: 0, eagle: 0, ace: 0, eagle_ace: 0 }
  for (const row of countsResult.data ?? []) {
    if (['fairway', 'eagle', 'ace'].includes(row.tier))
      counts[row.tier as 'fairway' | 'eagle' | 'ace'] = Number(row.count)
    counts.all += Number(row.count)
  }
  counts.eagle_ace = counts.eagle + counts.ace
  const address = [course.address, course.city, course.state, course.zip]
    .filter(Boolean)
    .join(', ')
  const hasAddress = [
    course.address,
    course.city,
    course.state,
    course.zip,
  ].every((value) => value?.trim())
  const signupUrl = `${marketingOrigin()}/course-updates/${encodeURIComponent(slug)}`
  return (
    <main className="p-4 sm:p-8 lg:p-10 text-[#1A3025] max-w-6xl w-full space-y-7">
      <header>
        <p className="text-xs uppercase tracking-[0.18em] text-[#6B7770]">
          Keep your golfers coming back
        </p>
        <h1 className="text-3xl font-semibold mt-2">Course marketing</h1>
        <p className="text-[#6B7770] mt-2 max-w-2xl">
          Fill an open tee time, grow your league, or give golfers a reason to
          stop by the clubhouse.
        </p>
      </header>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(['all', 'fairway', 'eagle', 'ace'] as const).map((tier) => (
          <div
            key={tier}
            className="rounded-xl border border-black/10 bg-white p-4"
          >
            <p className="text-sm text-[#6B7770]">{AUDIENCES[tier]}</p>
            <p className="mt-1 text-3xl font-semibold">{counts[tier]}</p>
          </div>
        ))}
      </div>
      {!hasAddress ? (
        <p role="alert" className="rounded-xl bg-amber-50 p-5">
          Add your full course mailing address in course setup before sending
          marketing emails.
        </p>
      ) : (
        <CampaignComposer
          slug={slug}
          courseName={course.name}
          address={address}
          counts={counts}
          campaignId={randomUUID()}
        />
      )}
      <section className="rounded-xl border border-black/10 bg-white p-5">
        <h2 className="font-semibold text-lg">Grow your course list</h2>
        <p className="text-sm text-[#6B7770] mt-2">
          Share this link on your website, at check-in, or on social media.
          Golfers can subscribe using their TeeAhead account.
        </p>
        <a className="block mt-3 text-sm underline break-all" href={signupUrl}>
          {signupUrl}
        </a>
        <p className="mt-2 text-xs text-[#6B7770]">
          Booking emails stay separate. Golfers can unsubscribe from promotions
          whenever they like.
        </p>
      </section>
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-xl">Campaign history</h2>
          <a href={`/course/${slug}/marketing`} className="text-sm underline">
            Refresh
          </a>
        </div>
        <p className="text-xs text-[#6B7770]">
          Sent counts mean accepted by the email provider, not confirmed inbox
          delivery. Up to five campaigns per day.
        </p>
        {!(historyResult.data as History[])?.length && (
          <p className="rounded-xl border border-dashed border-black/20 p-8 text-center text-[#6B7770]">
            Your first campaign will appear here.
          </p>
        )}
        {((historyResult.data as History[]) ?? []).map((item) => (
          <article
            key={item.id}
            className="rounded-xl border border-black/10 bg-white p-5"
          >
            <div className="flex justify-between flex-wrap gap-2">
              <h3 className="font-semibold break-words">{item.subject}</h3>
              <span className="rounded-full bg-[#FAF7F2] px-3 py-1 text-xs">
                {item.status === 'complete'
                  ? Number(item.failed)
                    ? 'Finished with errors'
                    : 'Finished'
                  : item.status === 'cancelled'
                    ? 'Stopped'
                    : 'Sending'}
              </span>
            </div>
            <p className="text-xs text-[#6B7770] mt-2">
              {AUDIENCES[item.audience]} ·{' '}
              {new Date(item.created_at).toLocaleDateString('en-US', {
                timeZone: 'America/Detroit',
              })}
            </p>
            <p className="text-sm mt-3">
              {item.sent} sent · {item.failed} failed · {item.skipped} skipped ·{' '}
              {item.status === 'cancelled'
                ? `${item.pending} stopped`
                : `${item.pending} remaining`}
            </p>
            {item.status === 'queued' && (
              <form action={cancelCampaign.bind(null, slug)} className="mt-3">
                <input type="hidden" name="id" value={item.id} />
                <button className="text-sm underline text-red-700">
                  Stop remaining emails
                </button>
                <p className="text-xs text-[#6B7770] mt-1">
                  An email already being sent may still arrive.
                </p>
              </form>
            )}
          </article>
        ))}
      </section>
    </main>
  )
}
