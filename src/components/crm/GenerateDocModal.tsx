'use client'

import { useState } from 'react'

interface DocTemplate {
  id: string
  label: string
  description: string
}

const COURSE_TEMPLATES: DocTemplate[] = [
  { id: 'founding-partner-agreement', label: 'Founding Partner Agreement', description: 'Agreement terms, obligations, signature block' },
  { id: 'course-proposal', label: 'Course Proposal', description: 'TeeAhead pitch, platform features, zero commitment' },
]

const OUTING_TEMPLATES: DocTemplate[] = [
  { id: 'outing-quote', label: 'Outing Quote', description: 'Event details, player count, pricing' },
  { id: 'outing-confirmation', label: 'Outing Confirmation', description: 'Confirmed event summary, next steps' },
]

interface Props {
  recordType: 'course' | 'outing'
  recordId: string
  createdBy: string
  onClose: () => void
  onGenerated: () => void
}

export function GenerateDocModal({ recordType, recordId, createdBy, onClose, onGenerated }: Props) {
  const templates = recordType === 'course' ? COURSE_TEMPLATES : OUTING_TEMPLATES
  const [selected, setSelected] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  async function handleGenerate() {
    if (!selected) return
    setGenerating(true)
    setError(null)

    try {
      const res = await fetch('/api/crm/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: selected, recordType, recordId, createdBy }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error ?? 'Generation failed')
      } else {
        setDownloadUrl(data.fileUrl)
        onGenerated()
      }
    } catch {
      setError('Network error')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Generate Document</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>

        {downloadUrl ? (
          <div className="text-center space-y-4 py-4">
            <div className="text-4xl">✅</div>
            <p className="font-medium text-slate-800">Document generated!</p>
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-2 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800"
            >
              Download PDF
            </a>
            <br />
            <button onClick={onClose} className="text-sm text-slate-400 hover:text-slate-600">Close</button>
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-6">
              {templates.map((t) => (
                <label
                  key={t.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors
                    ${selected === t.id ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <input
                    type="radio"
                    name="template"
                    value={t.id}
                    checked={selected === t.id}
                    onChange={() => setSelected(t.id)}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="font-medium text-slate-800 text-sm">{t.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{t.description}</div>
                  </div>
                </label>
              ))}
            </div>

            {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

            <div className="flex gap-2 justify-end">
              <button onClick={onClose} className="text-sm px-4 py-2 text-slate-500 hover:text-slate-700">Cancel</button>
              <button
                onClick={handleGenerate}
                disabled={!selected || generating}
                className="text-sm px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 disabled:opacity-50"
              >
                {generating ? 'Generating…' : 'Generate PDF'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
