export const metadata = { title: 'Review Template Drafts' }

import { createAdminClient } from '@/lib/supabase/admin'
import { ReviewClient } from './ReviewClient'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function TemplateReviewPage() {
  const supabase = createAdminClient()

  // Fetch all draft (v2) course templates
  const { data: drafts } = await supabase
    .from('crm_email_templates')
    .select('*')
    .eq('status', 'draft')
    .eq('version', 2)
    .eq('record_type', 'course')
    .order('name', { ascending: true })

  // Fetch matching active templates (same names, to show side-by-side)
  const draftNames = (drafts ?? []).map((d) => d.name)
  const { data: actives } = draftNames.length > 0
    ? await supabase
        .from('crm_email_templates')
        .select('*')
        .in('name', draftNames)
        .eq('status', 'active')
    : { data: [] }

  // Fetch counts of already-reviewed (approved = now active v2, rejected = archived v2)
  const { data: approved } = await supabase
    .from('crm_email_templates')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('version', 2)
    .eq('record_type', 'course')

  const { data: rejected } = await supabase
    .from('crm_email_templates')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'archived')
    .eq('version', 2)
    .eq('record_type', 'course')

  const approvedCount = (approved as unknown as { count: number } | null)?.count ?? 0
  const rejectedCount = (rejected as unknown as { count: number } | null)?.count ?? 0
  const reviewedCount = approvedCount + rejectedCount

  const activeMap = new Map((actives ?? []).map((a) => [a.name, a]))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Review Template Drafts</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            May 2026 REPLY framework rewrite, 40 course templates
          </p>
        </div>
        <Link
          href="/admin/crm/email-templates"
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Back to templates
        </Link>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">
            {reviewedCount} of 40 reviewed
          </span>
          <div className="flex gap-3 text-xs">
            <span className="text-emerald-700 font-medium">✓ {approvedCount} approved</span>
            <span className="text-red-500 font-medium">✕ {rejectedCount} rejected</span>
            <span className="text-slate-400">{(drafts ?? []).length} pending</span>
          </div>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div
            className="h-2 rounded-full bg-emerald-500 transition-all"
            style={{ width: `${Math.round((reviewedCount / 40) * 100)}%` }}
          />
        </div>
      </div>

      {(drafts ?? []).length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500 text-sm">All drafts have been reviewed.</p>
          <Link href="/admin/crm/email-templates" className="text-sm text-emerald-700 hover:underline mt-2 inline-block">
            View active templates →
          </Link>
        </div>
      ) : (
        <ReviewClient drafts={drafts ?? []} activeMap={Object.fromEntries(activeMap)} />
      )}
    </div>
  )
}
