'use client'

import { useState } from 'react'
import { InlineEditField } from '@/components/crm/InlineEditField'
import { LogActivityModal } from '@/components/crm/LogActivityModal'
import { EmailComposerModal } from '@/components/crm/EmailComposerModal'
import { GenerateDocModal } from '@/components/crm/GenerateDocModal'
import { updateCrmMember, deleteCrmMember } from '@/app/actions/crm/members'
import { useRouter } from 'next/navigation'
import type { CrmMember } from '@/lib/crm/types'

interface Props { member: CrmMember }

export function MemberDetailClient({ member }: Props) {
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showDocModal, setShowDocModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const router = useRouter()

  async function save(field: string, value: string) {
    await updateCrmMember(member.id, { [field]: value || null })
    router.refresh()
  }

  async function handleDelete() {
    await deleteCrmMember(member.id)
    router.push('/admin/crm/members')
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">Details</h3>
          <div className="flex gap-2">
            <button onClick={() => setShowActivityModal(true)} className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Log Activity</button>
            <button onClick={() => setShowEmailModal(true)} className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Send Email</button>
            <button onClick={() => setShowDocModal(true)} className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Generate Doc</button>
            <button onClick={() => setShowDeleteConfirm(true)} className="text-xs px-3 py-1.5 border border-red-200 rounded-lg text-red-500 hover:bg-red-50">Delete</button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <InlineEditField label="Email" value={member.email} onSave={(v) => save('email', v)} type="email" />
          <InlineEditField label="Phone" value={member.phone} onSave={(v) => save('phone', v)} type="tel" />
          <InlineEditField label="Home Course" value={member.home_course} onSave={(v) => save('home_course', v)} />
          <InlineEditField label="Join Date" value={member.join_date} onSave={(v) => save('join_date', v)} type="date" />
          <InlineEditField label="Lifetime Spend ($)" value={member.lifetime_spend?.toString() ?? '0'} onSave={(v) => save('lifetime_spend', v)} type="number" />
          <div className="col-span-2">
            <InlineEditField label="Notes" value={member.notes} onSave={(v) => save('notes', v)} type="textarea" />
          </div>
        </div>
      </div>

      {showActivityModal && (
        <LogActivityModal recordType="member" recordId={member.id} assignee="neil" onClose={() => setShowActivityModal(false)} onLogged={() => router.refresh()} />
      )}

      {showEmailModal && (
        <EmailComposerModal recordType="member" recordId={member.id} toEmail={member.email} sentBy="neil" onClose={() => setShowEmailModal(false)} onSent={() => router.refresh()} />
      )}

      {showDocModal && (
        <GenerateDocModal recordType="member" recordId={member.id} createdBy="neil" onClose={() => setShowDocModal(false)} onGenerated={() => router.refresh()} />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-semibold text-slate-800 mb-2">Delete {member.name}?</h3>
            <p className="text-sm text-slate-500 mb-4">This will permanently delete this member and all activity history.</p>
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
