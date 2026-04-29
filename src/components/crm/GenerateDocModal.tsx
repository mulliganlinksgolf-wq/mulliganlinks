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
  const [contractYears, setContractYears] = useState(1)
  const [monthlyFee, setMonthlyFee] = useState(349)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  const showContractOptions = selected === 'founding-partner-agreement'

  async function handleGenerate() {
    if (!selected) return
    setGenerating(true)
    setError(null)

    try {
      const body: Record<string, unknown> = { template: selected, recordType, recordId, createdBy }
      if (showContractOptions) {
        body.options = { contractYears, monthlyFee }
      }
      const res = await fetch('/api/crm/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
            <div className="space-y-2 mb-4">
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

            {showContractOptions && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 space-y-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Contract Options</p>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contract Duration</label>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((y) => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => setContractYears(y)}
                        className={`flex-1 py-1.5 text-sm rounded-lg border font-medium transition-colors
                          ${contractYears === y
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                      >
                        {y} {y === 1 ? 'Year' : 'Years'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Platform Fee</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <input
                      type="number"
                      min={0}
                      value={monthlyFee}
                      onChange={(e) => setMonthlyFee(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Annual equivalent: ${(monthlyFee * 12).toLocaleString()}/yr</p>
                </div>
              </div>
            )}

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
