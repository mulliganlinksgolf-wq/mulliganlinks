'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createCrmMember } from '@/app/actions/crm/members'
import { RecordHeader } from '@/components/crm/RecordHeader'

export default function NewMemberPage() {
  const router = useRouter()
  const [state, action, pending] = useActionState(createCrmMember, {})

  useEffect(() => {
    if (state.success && state.id) router.push(`/admin/crm/members/${state.id}`)
  }, [state.success, state.id, router])

  return (
    <div className="p-6 max-w-2xl">
      <RecordHeader backHref="/admin/crm/members" backLabel="Members" title="New Member" />
      {state.error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">{state.error}</div>}
      <form action={action} className="space-y-4 bg-white rounded-xl border border-slate-200 p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Name *</label>
            <input name="name" required className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Email</label>
            <input name="email" type="email" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Phone</label>
            <input name="phone" type="tel" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Membership Tier</label>
            <select name="membership_tier" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300">
              <option value="free">Free</option>
              <option value="eagle">Eagle</option>
              <option value="ace">Ace</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Status</label>
            <select name="status" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300">
              <option value="active">Active</option>
              <option value="lapsed">Lapsed</option>
              <option value="churned">Churned</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Home Course</label>
            <input name="home_course" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Join Date</label>
            <input name="join_date" type="date" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Lifetime Spend ($)</label>
            <input name="lifetime_spend" type="number" min="0" step="0.01" defaultValue="0" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Notes</label>
            <textarea name="notes" rows={3} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none" />
          </div>
        </div>
        <button type="submit" disabled={pending} className="px-4 py-2 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800 disabled:opacity-50">
          {pending ? 'Creating…' : 'Create Member'}
        </button>
      </form>
    </div>
  )
}
