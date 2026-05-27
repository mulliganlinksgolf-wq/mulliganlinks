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
  { id: 'benefits-schedule', label: 'Benefits Schedule', description: 'Eagle/Ace member rate card for pro shop staff' },
  { id: 'onboarding-packet', label: 'Onboarding Packet', description: 'Welcome guide for newly signed Founding Partners' },
  { id: 'termination-letter', label: 'Termination Letter', description: 'Formal notice of partnership termination' },
]

const OUTING_TEMPLATES: DocTemplate[] = [
  { id: 'outing-quote', label: 'Outing Quote', description: 'Event details, player count, pricing' },
  { id: 'outing-confirmation', label: 'Outing Confirmation', description: 'Confirmed event summary, next steps' },
  { id: 'outing-invoice', label: 'Outing Invoice', description: 'Balance due invoice after event completion' },
]

const MEMBER_TEMPLATES: DocTemplate[] = [
  { id: 'membership-card', label: 'Membership Card', description: 'Printable member card with tier and benefits' },
]

interface Props {
  recordType: 'course' | 'outing' | 'member'
  recordId: string
  createdBy: string
  onClose: () => void
  onGenerated: () => void
}

function todayStr() { return new Date().toISOString().split('T')[0] }
function daysFromNow(n: number) { return new Date(Date.now() + n * 864e5).toISOString().split('T')[0] }

export function GenerateDocModal({ recordType, recordId, createdBy, onClose, onGenerated }: Props) {
  const templates = recordType === 'course' ? COURSE_TEMPLATES : recordType === 'outing' ? OUTING_TEMPLATES : MEMBER_TEMPLATES
  const [selected, setSelected] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  // founding-partner-agreement options
  const [contractYears, setContractYears] = useState(1)
  const [monthlyFee, setMonthlyFee] = useState(349)

  // benefits-schedule options
  const [eagleRate, setEagleRate] = useState('')
  const [aceRate, setAceRate] = useState('')
  const [priorityHours, setPriorityHours] = useState('Mon–Fri before 10am')
  const [eagleCredits, setEagleCredits] = useState('20')
  const [aceCredits, setAceCredits] = useState('40')

  // termination-letter options
  const [noticeDate, setNoticeDate] = useState(todayStr)
  const [lastDay, setLastDay] = useState(() => daysFromNow(30))
  const [refundAmount, setRefundAmount] = useState(0)

  // outing-invoice options
  const [invoiceDueDate, setInvoiceDueDate] = useState(() => daysFromNow(14))
  const [depositPaid, setDepositPaid] = useState(0)

  const showContractOptions = selected === 'founding-partner-agreement'
  const showBenefitsOptions = selected === 'benefits-schedule'
  const showTerminationOptions = selected === 'termination-letter'
  const showInvoiceOptions = selected === 'outing-invoice'
  const hasConfigPanel = showContractOptions || showBenefitsOptions || showTerminationOptions || showInvoiceOptions

  async function handleGenerate() {
    if (!selected) return
    setGenerating(true)
    setError(null)

    try {
      const body: Record<string, unknown> = { template: selected, recordType, recordId, createdBy }
      if (showContractOptions) body.options = { contractYears, monthlyFee }
      if (showBenefitsOptions) body.options = { eagleRate, aceRate, priorityHours, eagleCredits, aceCredits }
      if (showTerminationOptions) body.options = { noticeDate, lastDay, refundAmount }
      if (showInvoiceOptions) body.options = { dueDate: invoiceDueDate, depositPaid }

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

  const inputCls = 'w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500'
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1'

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Generate Document</h2>
          <button aria-label="Close" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>

        {downloadUrl ? (
          <div className="text-center space-y-4 py-4">
            <div className="text-4xl">✅</div>
            <p className="font-medium text-slate-800">Document generated!</p>
            <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="inline-block px-6 py-2 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800">
              Download PDF
            </a>
            <br />
            <button onClick={onClose} className="text-sm text-slate-400 hover:text-slate-600">Close</button>
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-4">
              {templates.map((t) => (
                <label key={t.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selected === t.id ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <input type="radio" name="template" value={t.id} checked={selected === t.id} onChange={() => setSelected(t.id)} className="mt-0.5" />
                  <div>
                    <div className="font-medium text-slate-800 text-sm">{t.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{t.description}</div>
                  </div>
                </label>
              ))}
            </div>

            {hasConfigPanel && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 space-y-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Options</p>

                {showContractOptions && (
                  <>
                    <div>
                      <label className={labelCls}>Contract Duration</label>
                      <div className="flex gap-2" role="group" aria-labelledby="contract-duration-label">
                        <p id="contract-duration-label" className="sr-only">Contract Duration</p>
                        {[1, 2, 3].map((y) => (
                          <button key={y} type="button" onClick={() => setContractYears(y)} className={`flex-1 py-1.5 text-sm rounded-lg border font-medium transition-colors ${contractYears === y ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                            {y} {y === 1 ? 'Year' : 'Years'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label htmlFor="monthly-fee" className={labelCls}>Monthly Platform Fee</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                        <input id="monthly-fee" type="number" min={0} max={9999} step={1} value={monthlyFee} onChange={(e) => setMonthlyFee(Math.max(0, Math.round(Number(e.target.value) || 0)))} className={`${inputCls} pl-7`} />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Annual equivalent: ${(monthlyFee * 12).toLocaleString()}/yr</p>
                    </div>
                  </>
                )}

                {showBenefitsOptions && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="eagle-rate" className={labelCls}>Eagle Green Fee</label>
                        <input id="eagle-rate" type="text" placeholder="e.g. $45" value={eagleRate} onChange={(e) => setEagleRate(e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <label htmlFor="ace-rate" className={labelCls}>Ace Green Fee</label>
                        <input id="ace-rate" type="text" placeholder="e.g. $35" value={aceRate} onChange={(e) => setAceRate(e.target.value)} className={inputCls} />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="priority-hours" className={labelCls}>Priority Hours</label>
                      <input id="priority-hours" type="text" value={priorityHours} onChange={(e) => setPriorityHours(e.target.value)} className={inputCls} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="eagle-credits" className={labelCls}>Eagle Barter Credits/mo</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                          <input id="eagle-credits" type="number" min={0} value={eagleCredits} onChange={(e) => setEagleCredits(e.target.value)} className={`${inputCls} pl-7`} />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="ace-credits" className={labelCls}>Ace Barter Credits/mo</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                          <input id="ace-credits" type="number" min={0} value={aceCredits} onChange={(e) => setAceCredits(e.target.value)} className={`${inputCls} pl-7`} />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {showTerminationOptions && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="notice-date" className={labelCls}>Notice Date</label>
                        <input id="notice-date" type="date" value={noticeDate} onChange={(e) => setNoticeDate(e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <label htmlFor="last-day" className={labelCls}>Last Day of Listing</label>
                        <input id="last-day" type="date" value={lastDay} onChange={(e) => setLastDay(e.target.value)} className={inputCls} />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="refund-amount" className={labelCls}>Pro-Rata Refund Amount</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                        <input id="refund-amount" type="number" min={0} value={refundAmount} onChange={(e) => setRefundAmount(Math.max(0, Number(e.target.value) || 0))} className={`${inputCls} pl-7`} />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Enter 0 if no refund is owed</p>
                    </div>
                  </>
                )}

                {showInvoiceOptions && (
                  <>
                    <div>
                      <label htmlFor="invoice-due-date" className={labelCls}>Payment Due Date</label>
                      <input id="invoice-due-date" type="date" value={invoiceDueDate} onChange={(e) => setInvoiceDueDate(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label htmlFor="deposit-paid" className={labelCls}>Deposit Already Paid</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                        <input id="deposit-paid" type="number" min={0} value={depositPaid} onChange={(e) => setDepositPaid(Math.max(0, Number(e.target.value) || 0))} className={`${inputCls} pl-7`} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

            <div className="flex gap-2 justify-end">
              <button onClick={onClose} className="text-sm px-4 py-2 text-slate-500 hover:text-slate-700">Cancel</button>
              <button onClick={handleGenerate} disabled={!selected || generating} className="text-sm px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 disabled:opacity-50">
                {generating ? 'Generating…' : 'Generate PDF'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
