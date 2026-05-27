'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { approveTemplateDraft, rejectTemplateDraft } from '@/app/actions/crm/template-review'
import type { CrmEmailTemplate } from '@/lib/crm/types'

// Sample data for preview substitution
const PREVIEW_NAME = 'Pat'
const PREVIEW_COURSE = 'Maple Lane Golf Club'

function substitutePreview(html: string): string {
  return html
    .replace(/\{\{name\}\}/g, PREVIEW_NAME)
    .replace(/\{\{course_name\}\}/g, PREVIEW_COURSE)
    .replace(/\{\{date\}\}/g, 'Thursday, June 5 at 10am')
    .replace(/\{\{meeting_link\}\}/g, 'https://cal.com/teeahead/demo')
}

interface Props {
  drafts: CrmEmailTemplate[]
  activeMap: Record<string, CrmEmailTemplate>
}

export function ReviewClient({ drafts, activeMap }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(drafts[0]?.id ?? null)
  const [previewMode, setPreviewMode] = useState<Record<string, 'diff' | 'preview'>>({})
  const router = useRouter()

  async function handleApprove(id: string) {
    setLoading(id)
    setError(null)
    const result = await approveTemplateDraft(id)
    setLoading(null)
    if (result.error) { setError(result.error); return }
    router.refresh()
  }

  async function handleReject(id: string) {
    setLoading(id)
    setError(null)
    const result = await rejectTemplateDraft(id)
    setLoading(null)
    if (result.error) { setError(result.error); return }
    router.refresh()
  }

  function toggleMode(id: string) {
    setPreviewMode((p) => ({ ...p, [id]: p[id] === 'preview' ? 'diff' : 'preview' }))
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-2 border border-red-200">
          {error}
        </div>
      )}

      {drafts.map((draft) => {
        const active = activeMap[draft.name]
        const isExpanded = expanded === draft.id
        const mode = previewMode[draft.id] ?? 'diff'

        return (
          <div key={draft.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Header row */}
            <div
              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => setExpanded(isExpanded ? null : draft.id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-slate-400 text-xs select-none">{isExpanded ? '▾' : '▸'}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{draft.name}</p>
                  <p className="text-xs text-slate-400 font-mono truncate">{draft.subject}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-4" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleReject(draft.id)}
                  disabled={loading === draft.id}
                  className="px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-40 transition-colors"
                >
                  {loading === draft.id ? '…' : 'Reject'}
                </button>
                <button
                  onClick={() => handleApprove(draft.id)}
                  disabled={loading === draft.id}
                  className="px-3 py-1.5 text-xs bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 disabled:opacity-40 transition-colors"
                >
                  {loading === draft.id ? '…' : 'Approve'}
                </button>
              </div>
            </div>

            {/* Expanded comparison panel */}
            {isExpanded && (
              <div className="border-t border-slate-100">
                {/* Toggle: diff vs preview */}
                <div className="flex gap-1 px-4 pt-3 pb-1">
                  <button
                    onClick={() => toggleMode(draft.id)}
                    className={`text-xs px-2.5 py-1 rounded-md transition-colors ${mode === 'diff' ? 'bg-slate-100 text-slate-700 font-medium' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Side-by-side
                  </button>
                  <button
                    onClick={() => toggleMode(draft.id)}
                    className={`text-xs px-2.5 py-1 rounded-md transition-colors ${mode === 'preview' ? 'bg-slate-100 text-slate-700 font-medium' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Preview (with {PREVIEW_NAME} / {PREVIEW_COURSE})
                  </button>
                </div>

                {mode === 'diff' ? (
                  <div className="grid grid-cols-2 gap-0 p-4 pt-2">
                    {/* Active (current) */}
                    <div className="pr-3 border-r border-slate-100">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Current (active)</p>
                      {active ? (
                        <>
                          <p className="text-xs text-slate-500 mb-2">
                            <span className="font-medium text-slate-600">Subject:</span>{' '}
                            <span className={active.subject !== draft.subject ? 'bg-red-50 text-red-700 px-1 rounded' : ''}>
                              {active.subject}
                            </span>
                          </p>
                          <div
                            className="text-xs text-slate-600 leading-relaxed [&_p]:mb-2"
                            dangerouslySetInnerHTML={{ __html: active.body_html }}
                          />
                        </>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No active version</p>
                      )}
                    </div>

                    {/* Draft (proposed) */}
                    <div className="pl-3">
                      <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">Draft (proposed)</p>
                      <p className="text-xs text-slate-500 mb-2">
                        <span className="font-medium text-slate-600">Subject:</span>{' '}
                        <span className={active && active.subject !== draft.subject ? 'bg-emerald-50 text-emerald-700 px-1 rounded' : ''}>
                          {draft.subject}
                        </span>
                      </p>
                      <div
                        className="text-xs text-slate-600 leading-relaxed [&_p]:mb-2"
                        dangerouslySetInnerHTML={{ __html: draft.body_html }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 pt-2">
                    <p className="text-xs text-slate-400 mb-2 font-medium">
                      Subject: <span className="text-slate-700">{substitutePreview(draft.subject)}</span>
                    </p>
                    <div
                      className="text-sm text-slate-700 leading-relaxed [&_p]:mb-3 bg-slate-50 rounded-lg p-4"
                      dangerouslySetInnerHTML={{ __html: substitutePreview(draft.body_html) }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
