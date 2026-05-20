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
      <TemplatesClient initialTemplates={templates ?? []} />
    </div>
  )
}
