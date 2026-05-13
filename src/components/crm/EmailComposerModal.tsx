'use client'

import { useState, useEffect } from 'react'
import { sendCrmEmail, getEmailTemplatesByType, getLastEmailToContact } from '@/app/actions/crm/email'
import { htmlToPlainText, plainTextToHtml } from '@/lib/crm/email-format'
import type { CrmRecordType, CrmEmailTemplate } from '@/lib/crm/types'

interface PreviousEmail {
  message_id: string | null
  subject: string
  body: string | null
  created_at: string
}

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
  const [bodyText, setBodyText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [previousEmail, setPreviousEmail] = useState<PreviousEmail | null>(null)
  const [replyMode, setReplyMode] = useState(false)
  const [showPrevExpanded, setShowPrevExpanded] = useState(false)

  useEffect(() => {
    getEmailTemplatesByType(recordType).then(setTemplates)
  }, [recordType])

  // Look up the most recent email to this recipient so we can offer threading
  useEffect(() => {
    if (!toEmail) { setPreviousEmail(null); return }
    getLastEmailToContact({ recordType, recordId, toEmail }).then((prev) => {
      setPreviousEmail(prev)
      // Auto-enable reply mode only when we can actually thread (message_id present)
      if (prev?.message_id) setReplyMode(true)
    })
  }, [recordType, recordId, toEmail])

  // When reply mode flips on, force the subject to match the thread.
  // (Email clients use Message-ID for threading, but a matching subject is still
  // what humans see in the inbox preview — and it's standard email etiquette.)
  useEffect(() => {
    if (replyMode && previousEmail) {
      const prevSubject = previousEmail.subject
      const reSubject = prevSubject.match(/^re:\s*/i) ? prevSubject : `Re: ${prevSubject}`
      setSubject(reSubject)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replyMode, previousEmail])

  function substituteVars(text: string): string {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? variables[key.toLowerCase()] ?? `{{${key}}}`)
  }

  function applyTemplate(template: CrmEmailTemplate) {
    // In reply mode, preserve the thread subject — the template only fills the body.
    if (!(replyMode && previousEmail)) {
      setSubject(substituteVars(template.subject))
    }
    setBodyText(htmlToPlainText(substituteVars(template.body_html)))
    setAppliedTemplateId(template.id)
    setShowPreview(false)
  }

  function clearTemplate() {
    setSubject('')
    setBodyText('')
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
    if (!bodyText.trim()) { setError('Email body is required'); return }
    setSending(true)
    setError(null)
    const bodyHtml = plainTextToHtml(bodyText)
    const result = await sendCrmEmail({
      recordType, recordId, to, subject, bodyHtml, sentBy,
      inReplyTo: replyMode && previousEmail ? previousEmail.message_id : null,
    })
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
          {previousEmail && (
            <div className={`rounded-lg border ${previousEmail.message_id ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
              <div className="flex items-start gap-3 p-3">
                {previousEmail.message_id ? (
                  <input
                    id="reply-mode"
                    type="checkbox"
                    checked={replyMode}
                    onChange={(e) => setReplyMode(e.target.checked)}
                    className="mt-0.5 w-4 h-4"
                  />
                ) : (
                  <span className="mt-0.5 text-amber-600 text-sm">ℹ</span>
                )}
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor={previousEmail.message_id ? 'reply-mode' : undefined}
                    className={`text-xs flex-1 ${previousEmail.message_id ? 'text-emerald-900 cursor-pointer' : 'text-amber-900'}`}
                  >
                    <div className="font-medium">
                      {previousEmail.message_id ? 'Reply to last email' : 'Previous email to this contact'}
                    </div>
                    <div className={`mt-0.5 ${previousEmail.message_id ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {new Date(previousEmail.created_at).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                        timeZone: 'America/Detroit',
                      })} · "{previousEmail.subject}"
                    </div>
                    <div className={`mt-1 ${previousEmail.message_id ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {previousEmail.message_id
                        ? 'Threads with the recipient\'s email client so they see the conversation history.'
                        : 'This email was logged before threading was supported, so the new email will start a fresh thread.'}
                    </div>
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPrevExpanded((s) => !s)}
                  className={`text-xs underline shrink-0 ${previousEmail.message_id ? 'text-emerald-700 hover:text-emerald-900' : 'text-amber-700 hover:text-amber-900'}`}
                >
                  {showPrevExpanded ? 'Hide' : 'Show'}
                </button>
              </div>
              {showPrevExpanded && previousEmail.body && (
                <div className={`px-3 pb-3 text-xs whitespace-pre-wrap font-mono ${previousEmail.message_id ? 'text-emerald-900' : 'text-amber-900'}`}>
                  {previousEmail.body}
                </div>
              )}
            </div>
          )}
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
              autoComplete="off"
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
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Body * <span className="text-slate-400 normal-case">(separate paragraphs with a blank line)</span>
              </label>
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
                className="w-full min-h-48 text-sm border border-slate-200 rounded-lg px-4 py-3 bg-slate-50"
                dangerouslySetInnerHTML={{ __html: plainTextToHtml(bodyText) }}
              />
            ) : (
              <textarea
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                required
                rows={12}
                placeholder="Hi {{name}}, ..."
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300 leading-relaxed"
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
