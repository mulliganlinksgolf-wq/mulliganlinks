'use client'

import { useState } from 'react'
import { InlineEditField } from '@/components/crm/InlineEditField'
import { LogActivityModal } from '@/components/crm/LogActivityModal'
import { updateOuting, deleteOuting } from '@/app/actions/crm/outings'
import { useRouter } from 'next/navigation'
import type { CrmOuting } from '@/lib/crm/types'

interface Props { outing: CrmOuting }

export function OutingDetailClient({ outing }: Props) {
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const router = useRouter()

  async function save(field: string, value: string) {
    await updateOuting(outing.id, { [field]: value || null })
    router.refresh()
  }

  async function handleDelete() {
    await deleteOuting(outing.id)
    router.push('/admin/crm/outings')
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">Details</h3>
          <div className="flex gap-2">
            <button onClick={() => setShowActivityModal(true)} className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Log Activity</button>
            <button onClick={() => setShowDeleteConfirm(true)} className="text-xs px-3 py-1.5 border border-red-200 rounded-lg text-red-500 hover:bg-red-50">Delete</button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <InlineEditField label="Contact Email" value={outing.contact_email} onSave={(v) => save('contact_email', v)} type="email" />
          <InlineEditField label="Contact Phone" value={outing.contact_phone} onSave={(v) => save('contact_phone', v)} type="tel" />
          <InlineEditField label="Event Date" value={outing.event_date} onSave={(v) => save('event_date', v)} type="date" />
          <InlineEditField label="# Golfers" value={outing.num_golfers?.toString() ?? null} onSave={(v) => save('num_golfers', v)} type="number" />
          <InlineEditField label="Preferred Course" value={outing.preferred_course} onSave={(v) => save('preferred_course', v)} />
          <InlineEditField label="Budget Estimate ($)" value={outing.budget_estimate?.toString() ?? null} onSave={(v) => save('budget_estimate', v)} type="number" />
          <div className="col-span-2">
            <InlineEditField label="Notes" value={outing.notes} onSave={(v) => save('notes', v)} type="textarea" />
          </div>
        </div>
      </div>

      {showActivityModal && (
        <LogActivityModal
          recordType="outing"
          recordId={outing.id}
          assignee={outing.assigned_to ?? 'neil'}
          onClose={() => setShowActivityModal(false)}
          onLogged={() => router.refresh()}
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-semibold text-slate-800 mb-2">Delete outing for {outing.contact_name}?</h3>
            <p className="text-sm text-slate-500 mb-4">This will permanently delete this outing and all activity history.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowDeleteConfirm(false)} className="text-sm px-4 py-2 text-slate-500">Cancel</button>
              <button onClick={handleDelete} className="text-sm px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
