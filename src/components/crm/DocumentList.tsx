import type { CrmDocument } from '@/lib/crm/types'
import { createAdminClient } from '@/lib/supabase/admin'

interface Props {
  recordType: 'course' | 'outing' | 'member'
  recordId: string
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  }).format(new Date(iso))
}

export async function DocumentList({ recordType, recordId }: Props) {
  const supabase = createAdminClient()
  const { data: docs } = await supabase
    .from('crm_documents')
    .select('*')
    .eq('record_type', recordType)
    .eq('record_id', recordId)
    .order('generated_at', { ascending: false })

  if (!docs || docs.length === 0) {
    return <p className="text-sm text-slate-400">No documents generated yet.</p>
  }

  return (
    <ul className="space-y-2">
      {docs.map((doc: CrmDocument) => (
        <li key={doc.id} className="flex items-center gap-2 text-sm">
          <span className="text-slate-400">📄</span>
          <span className="flex-1 text-slate-700">{doc.name}</span>
          <span className="text-xs text-slate-400">{formatDate(doc.generated_at)}</span>
          {doc.file_url && (
            <a
              href={doc.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-600 hover:underline"
            >
              Download
            </a>
          )}
        </li>
      ))}
    </ul>
  )
}
