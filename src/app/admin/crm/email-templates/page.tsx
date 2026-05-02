export const metadata = { title: 'Email Templates' }

import { createAdminClient } from '@/lib/supabase/admin'
import { TemplatesClient } from './TemplatesClient'

export const dynamic = 'force-dynamic'

export default async function TemplatesPage() {
  const supabase = createAdminClient()
  const { data: templates } = await supabase
    .from('crm_email_templates')
    .select('*')
    .order('record_type', { ascending: true })

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Email Templates</h1>
      </div>
      <TemplatesClient initialTemplates={templates ?? []} />
    </div>
  )
}
