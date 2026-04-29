'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createCourse } from '@/app/actions/crm/courses'
import { RecordHeader } from '@/components/crm/RecordHeader'

const initialState = { error: undefined, success: undefined }

export default function NewCoursePage() {
  const router = useRouter()
  const [state, action, pending] = useActionState(createCourse, initialState)

  useEffect(() => {
    if (state.success && state.id) router.push(`/admin/crm/courses/${state.id}`)
  }, [state.success, state.id, router])

  return (
    <div className="p-6 max-w-2xl">
      <RecordHeader backHref="/admin/crm/courses" backLabel="Course Pipeline" title="New Course" />

      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4 bg-white rounded-xl border border-slate-200 p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
              Course Name *
            </label>
            <input name="name" required className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">City</label>
            <input name="city" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">State</label>
            <input name="state" maxLength={2} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Contact Name</label>
            <input name="contact_name" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Contact Email</label>
            <input name="contact_email" type="email" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Contact Phone</label>
            <input name="contact_phone" type="tel" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Est. Annual Value ($)</label>
            <input name="estimated_value" type="number" min="0" step="1" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Assigned To</label>
            <select name="assigned_to" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300">
              <option value="">Unassigned</option>
              <option value="neil">Neil</option>
              <option value="billy">Billy</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Stage</label>
            <select name="stage" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300">
              {['lead','contacted','demo','negotiating','partner','churned'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Notes</label>
            <textarea name="notes" rows={3} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none" />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="px-4 py-2 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800 disabled:opacity-50"
          >
            {pending ? 'Creating…' : 'Create Course'}
          </button>
        </div>
      </form>
    </div>
  )
}
