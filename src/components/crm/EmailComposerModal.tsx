'use client'

import { useState, useEffect } from 'react'
import { sendCrmEmail, getEmailTemplatesByType } from '@/app/actions/crm/email'
import type { CrmRecordType, CrmEmailTemplate } from '@/lib/crm/types'

interface Props {
  recordType: CrmRecordType
  recordId: string
  toEmail: string | null
  sentBy: string
  onClose: () => void
  onSent: () => void
}

export function EmailComposerModal({ recordType, recordId, toEmail, sentBy, onClose, onSent }: Props) {
  const [templates, setTemplates] = useState<CrmEmailTemplate[]>([])
  const [to, setTo] = useState(toEmail ?? '')
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    getEmailTemplatesByType(recordType).then(setTemplates)
  }, [recordType])

  function applyTemplate(template: CrmEmailTemplate) {
    setSubject(template.subject)
    setBodyHtml(template.body_html)
  }

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
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1">Template</label>
              <select
                defaultValue=""
                onChange={(e) => {
                  const t = templates.find((t) => t.id === e.target.value)
                  if (t) applyTemplate(t)
                }}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              >
                <option value="">Select a template…</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
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
