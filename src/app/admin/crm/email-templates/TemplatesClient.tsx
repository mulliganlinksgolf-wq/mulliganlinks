'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
} from '@/app/actions/crm/templates'
import type { CrmEmailTemplate, CrmRecordType } from '@/lib/crm/types'

const RECORD_TYPES: CrmRecordType[] = ['course', 'outing', 'member']
const typeColors: Record<CrmRecordType, string> = {
  course: 'bg-blue-100 text-blue-700',
  outing: 'bg-amber-100 text-amber-700',
  member: 'bg-emerald-100 text-emerald-700',
}

interface Props {
  initialTemplates: CrmEmailTemplate[]
}

export function TemplatesClient({ initialTemplates }: Props) {
  const templates = initialTemplates
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const router = useRouter()

  const [newName, setNewName] = useState('')
  const [newSubject, setNewSubject] = useState('')
  const [newBody, setNewBody] = useState('')
  const [newRecordType, setNewRecordType] = useState<CrmRecordType>('course')
  const [saving, setSaving] = useState(false)

  const [editFields, setEditFields] = useState<Partial<CrmEmailTemplate>>({})

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    const fd = new FormData()
    fd.set('name', newName)
    fd.set('subject', newSubject)
    fd.set('body_html', newBody)
    fd.set('record_type', newRecordType)
    const result = await createEmailTemplate({}, fd)
    setSaving(false)
    if (result.error) { setFormError(result.error); return }
    setCreating(false)
    setNewName(''); setNewSubject(''); setNewBody(''); setNewRecordType('course')
    router.refresh()
  }

  async function handleUpdate(id: string) {
    setSaving(true)
    const result = await updateEmailTemplate(id, editFields)
    setSaving(false)
    if (result.error) { setFormError(result.error); return }
    setEditingId(null)
    setEditFields({})
    router.refresh()
  }

  async function handleDelete(id: string) {
    await deleteEmailTemplate(id)
    setDeleteConfirmId(null)
    router.refresh()
  }

  function startEdit(template: CrmEmailTemplate) {
    setEditingId(template.id)
    setEditFields({ name: template.name, subject: template.subject, body_html: template.body_html, record_type: template.record_type })
  }

  const grouped = RECORD_TYPES.reduce((acc, rt) => {
    acc[rt] = templates.filter((t) => t.record_type === rt)
    return acc
  }, {} as Record<CrmRecordType, CrmEmailTemplate[]>)

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setCreating(true)}
          className="px-3 py-1.5 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800"
        >
          + New Template
        </button>
      </div>

      {creating && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">New Template</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Name</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} required className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Record Type</label>
                <select value={newRecordType} onChange={(e) => setNewRecordType(e.target.value as CrmRecordType)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300">
                  {RECORD_TYPES.map((rt) => <option key={rt} value={rt}>{rt}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Subject</label>
                <input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} required className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Body (HTML)</label>
                <textarea value={newBody} onChange={(e) => setNewBody(e.target.value)} required rows={6} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none font-mono text-xs" />
              </div>
            </div>
            {formError && <p className="text-sm text-red-500">{formError}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-emerald-700 text-white text-sm rounded-lg hover:bg-emerald-800 disabled:opacity-50">{saving ? 'Creating…' : 'Create'}</button>
              <button type="button" onClick={() => setCreating(false)} className="px-4 py-2 text-slate-500 text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {RECORD_TYPES.map((rt) => (
        <div key={rt}>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 capitalize">{rt} Templates</h2>
          {grouped[rt].length === 0 ? (
            <p className="text-sm text-slate-400 mb-4">No {rt} templates yet.</p>
          ) : (
            <div className="space-y-3">
              {grouped[rt].map((template) => (
                <div key={template.id} className="bg-white rounded-xl border border-slate-200 p-4">
                  {editingId === template.id ? (
                    <div className="space-y-3">
                      <input value={editFields.name ?? ''} onChange={(e) => setEditFields((p) => ({ ...p, name: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300 font-medium" />
                      <input value={editFields.subject ?? ''} onChange={(e) => setEditFields((p) => ({ ...p, subject: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" placeholder="Subject" />
                      <textarea value={editFields.body_html ?? ''} onChange={(e) => setEditFields((p) => ({ ...p, body_html: e.target.value }))} rows={6} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none font-mono text-xs" />
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdate(template.id)} disabled={saving} className="px-3 py-1.5 bg-emerald-700 text-white text-xs rounded-lg hover:bg-emerald-800 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
                        <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-slate-500 text-xs">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <span className="font-medium text-slate-800 text-sm">{template.name}</span>
                          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full capitalize ${typeColors[template.record_type]}`}>{template.record_type}</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => startEdit(template)} className="text-xs text-slate-500 hover:text-slate-700">Edit</button>
                          <button onClick={() => setDeleteConfirmId(template.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">Subject: {template.subject}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-semibold text-slate-800 mb-2">Delete this template?</h3>
            <p className="text-sm text-slate-500 mb-4">This cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirmId(null)} className="text-sm px-4 py-2 text-slate-500">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirmId)} className="text-sm px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
