'use client'

import { useState, useRef } from 'react'

interface Props {
  label: string
  value: string | null
  onSave: (value: string) => Promise<void>
  type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'textarea'
  placeholder?: string
}

export function InlineEditField({ label, value, onSave, type = 'text', placeholder = '—' }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null)

  async function handleSave() {
    setSaving(true)
    await onSave(draft)
    setSaving(false)
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && type !== 'textarea') handleSave()
    if (e.key === 'Escape') { setDraft(value ?? ''); setEditing(false) }
  }

  if (editing) {
    return (
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</label>
        {type === 'textarea' ? (
          <textarea
            ref={inputRef as React.Ref<HTMLTextAreaElement>}
            className="w-full text-sm border border-emerald-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none"
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        ) : (
          <input
            ref={inputRef as React.Ref<HTMLInputElement>}
            type={type}
            className="w-full text-sm border border-emerald-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        )}
        <div className="flex gap-2 mt-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs px-2 py-0.5 bg-emerald-700 text-white rounded hover:bg-emerald-800 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={() => { setDraft(value ?? ''); setEditing(false) }}
            className="text-xs px-2 py-0.5 text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-0.5 group cursor-pointer" onClick={() => setEditing(true)}>
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="text-sm text-slate-800 flex items-center gap-1">
        <span>{value || <span className="text-slate-400">{placeholder}</span>}</span>
        <span className="opacity-0 group-hover:opacity-100 text-slate-400 text-xs">✏️</span>
      </div>
    </div>
  )
}
