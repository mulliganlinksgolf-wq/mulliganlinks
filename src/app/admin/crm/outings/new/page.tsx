'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createOuting } from '@/app/actions/crm/outings'
import { RecordHeader } from '@/components/crm/RecordHeader'

export default function NewOutingPage() {
  const router = useRouter()
  const [state, action, pending] = useActionState(createOuting, {})

  useEffect(() => {
    if (state.success && state.id) router.push(`/admin/crm/outings/${state.id}`)
  }, [state.success, state.id, router])

  return (
    <div className="p-6 max-w-2xl">
      <RecordHeader backHref="/admin/crm/outings" backLabel="Outing Leads" title="New Outing Lead" />
      {state.error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">{state.error}</div>}
      <form action={action} className="space-y-4 bg-white rounded-xl border border-slate-200 p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Contact Name *</label>
            <input name="contact_name" required className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
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
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Event Date</label>
            <input name="event_date" type="date" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Number of Golfers</label>
            <input name="num_golfers" type="number" min="1" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Preferred Course</label>
            <input name="preferred_course" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Budget Estimate ($)</label>
            <input name="budget_estimate" type="number" min="0" step="0.01" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Assigned To</label>
            <select name="assigned_to" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300">
              <option value="">Unassigned</option>
              <option value="neil">Neil</option>
              <option value="billy">Billy</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Notes</label>
            <textarea name="notes" rows={3} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none" />
          </div>
        </div>
        <button type="submit" disabled={pending} className="px-4 py-2 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800 disabled:opacity-50">
          {pending ? 'Creating…' : 'Create Outing Lead'}
        </button>
      </form>
    </div>
  )
}
