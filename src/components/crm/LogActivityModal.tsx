'use client'

import { useState } from 'react'
import { logActivity } from '@/app/actions/crm/activity'
import type { CrmActivityType, CrmRecordType } from '@/lib/crm/types'

const ACTIVITY_TYPES: CrmActivityType[] = [
  'call', 'email', 'note', 'meeting', 'demo', 'contract_sent',
]

interface Props {
  recordType: CrmRecordType
  recordId: string
  assignee: string
  onClose: () => void
  onLogged: () => void
}

export function LogActivityModal({ recordType, recordId, assignee, onClose, onLogged }: Props) {
  const [type, setType] = useState<CrmActivityType>('note')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const result = await logActivity(recordType, recordId, type, body, assignee)
    setSaving(false)
    if (result.error) {
      setError(result.error)
    } else {
      onLogged()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Log Activity</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CrmActivityType)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1">
              Notes
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none"
              placeholder="What happened?"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="text-sm px-4 py-2 text-slate-500 hover:text-slate-700">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="text-sm px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 disabled:opacity-50"
            >
              {saving ? 'Logging…' : 'Log Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
