'use client'

import { useState, useEffect } from 'react'
import { sendCrmEmail, getEmailTemplatesByType } from '@/app/actions/crm/email'
import type { CrmRecordType, CrmEmailTemplate } from '@/lib/crm/types'

interface Props {
  recordType: CrmRecordType
  recordId: string
  toEmail: string | null
  sentBy: string
  variables?: Record<string, string>
  onClose: () => void
  onSent: () => void
}

export function EmailComposerModal({ recordType, recordId, toEmail, sentBy, variables = {}, onClose, onSent }: Props) {
  const [templates, setTemplates] = useState<CrmEmailTemplate[]>([])
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [to, setTo] = useState(toEmail ?? '')
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    getEmailTemplatesByType(recordType).then(setTemplates)
  }, [recordType])

  function substituteVars(text: string): string {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? variables[key.toLowerCase()] ?? `{{${key}}}`)
  }

  function applyTemplate(template: CrmEmailTemplate) {
    setSubject(substituteVars(template.subject))
    setBodyHtml(substituteVars(template.body_html))
    setAppliedTemplateId(template.id)
  }

  function clearTemplate() {
    setSubject('')
    setBodyHtml('')
    setAppliedTemplateId(null)
  }

  const filtered = filter.trim()
    ? templates.filter(t =>
        t.name.toLowerCase().includes(filter.toLowerCase()) ||
        t.subject.toLowerCase().includes(filter.toLowerCase())
      )
    : templates

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!to) { setError('Recipient email is required'); return }
    setSending(true)
    setError(null)
    const result = await sendCrmEmail({ recordType, recordId, to, subject, bodyHtml, sentBy })
    setSending(false)
    if (result.error) {
      setError(result.error)
    } else {
      onSent()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Send Email</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
          </div>
        </div>

        <form onSubmit={handleSend} className="p-6 space-y-4">
          {templates.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Templates <span className="text-slate-400 normal-case">({templates.length})</span>
                </label>
                {appliedTemplateId && (
                  <button
                    type="button"
                    onClick={clearTemplate}
                    className="text-xs text-slate-500 hover:text-red-500"
                  >
                    Clear
                  </button>
                )}
              </div>
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter templates…"
                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-1.5 mb-2 focus:outline-none focus:ring-1 focus:ring-emerald-300"
              />
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                {filtered.map((t) => {
                  const active = appliedTemplateId === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => applyTemplate(t)}
                      title={t.subject}
                      className={`text-left p-2 rounded-lg border transition-colors text-xs
                        ${active
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                          : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700'}`}
                    >
                      <div className="font-medium truncate">{t.name}</div>
                      <div className="text-slate-400 truncate text-[10px] mt-0.5">{t.subject}</div>
                    </button>
                  )
                })}
                {filtered.length === 0 && (
                  <div className="col-span-2 text-xs text-slate-400 text-center py-3">
                    No templates match "{filter}"
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1">To *</label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              required
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1">Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Body *</label>
              <button
                type="button"
                onClick={() => setShowPreview((v) => !v)}
                className="text-xs text-emerald-600 hover:underline"
              >
                {showPreview ? 'Edit' : 'Preview'}
              </button>
            </div>
            {showPreview ? (
              <div
                className="w-full min-h-48 text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />
            ) : (
              <textarea
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                required
                rows={8}
                placeholder="HTML email body…"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none font-mono text-xs"
              />
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="text-sm px-4 py-2 text-slate-500 hover:text-slate-700">
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="text-sm px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Send Email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
