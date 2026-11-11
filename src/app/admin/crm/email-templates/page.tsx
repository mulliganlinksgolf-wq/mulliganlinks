export const metadata = { title: 'Email Templates' }

import { createAdminClient } from '@/lib/supabase/admin'
import { TemplatesClient } from './TemplatesClient'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function TemplatesPage() {
  const supabase = createAdminClient()
  const [{ data: templates }, { count: draftCount }] = await Promise.all([
    supabase
      .from('crm_email_templates')
      .select('*')
      .eq('status', 'active')
      .order('record_type', { ascending: true }),
    supabase
      .from('crm_email_templates')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'draft')
      .eq('version', 2)
      .eq('record_type', 'course'),
  ])

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Email Templates</h1>
        {(draftCount ?? 0) > 0 && (
          <Link
            href="/admin/crm/email-templates/review"
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium rounded-lg hover:bg-amber-100 transition-colors"
          >
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">
              {draftCount}
            </span>
            Drafts pending review
          </Link>
        )}
      </div>
      <details className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-slate-700">
        <summary className="cursor-pointer font-semibold text-emerald-900">Michigan winter outreach: which email to use</summary>
        <div className="mt-3 max-w-3xl space-y-3">
          <p>In a course email, choose the <strong>Michigan Winter</strong> template group. Start with <strong>01 Before spring</strong> for owners and GMs, or <strong>02 Pro shop workload</strong> for operations contacts. For an earlier unanswered email, use <strong>03 Earlier email unanswered</strong>. Choose one opener per course.</p>
          <p>If there is no reply, send <strong>04 A useful comparison</strong> after 5–7 business days, then <strong>06 Leave it here</strong> after another 7–10 business days and stop. Use <strong>05 Right person</strong> instead of a follow-up when the decision-maker is unclear. Check earlier outreach before starting; this collection is not a reason to restart an exhausted sequence.</p>
          <p>Use reply mode for follow-ups to keep the original thread. Stop the sequence when someone replies. Use <strong>07 Previously said offseason</strong> only after an actual conversation, and <strong>08 After a positive reply</strong> only once they express interest. Add two real available meeting times to 08 when possible.</p>
          <p>Before sending, confirm the contact and course, replace any remaining placeholders, and add one relevant detail you have verified. Check the sender signature in preview. If you offer a one-page comparison, prepare it before following up; include current written pricing and any transition questions still to resolve.</p>
          <p>Start with a small group of comparable courses. Test one opener angle at a time and log positive replies and qualified conversations against delivered emails. Check bounces, sender authentication, and the reply mailbox if responses remain low. Timing and copy alone cannot fix inbox delivery.</p>
          <p className="text-xs text-slate-600">Research: <a className="underline" href="https://www.gong.io/blog/this-surprising-cold-email-cta-will-help-you-book-a-lot-more-meetings" target="_blank" rel="noreferrer">Gong: ask for interest first</a>; <a className="underline" href="https://belkins.io/blog/cold-email-response-rates" target="_blank" rel="noreferrer">Belkins: reply measurement and targeting</a>; <a className="underline" href="https://support.google.com/a/answer/81126?hl=en" target="_blank" rel="noreferrer">Google: sender guidelines</a>. These are general B2B findings; the cadence above is a starting recommendation for this outreach, not a proven golf-course benchmark.</p>
        </div>
      </details>
      <TemplatesClient initialTemplates={templates ?? []} />
    </div>
  )
}
